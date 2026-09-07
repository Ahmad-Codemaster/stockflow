/**
 * ============================================================================
 * PRODUCT SERVICE — Catalog Management & SKU Governance
 * ============================================================================
 * What this module does:
 * - Product catalog CRUD operations (Create, Read, Update, Delete).
 * - Enforces case-insensitive SKU uniqueness across the entire system.
 * - Dynamically calculates stock status ('In Stock', 'Low Stock', 'Out of Stock').
 * - Atomically writes both the product AND an initial stock transaction when created with stock.
 * - Implements Soft-Delete (`isArchived = true`) to preserve historical transaction integrity.
 */

import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

/**
 * COMPUTE STOCK STATUS
 * 
 * Dynamic status computation based on business invariants:
 * - `quantity <= 0`              -> 'Out of Stock'
 * - `quantity <= reorderLevel`   -> 'Low Stock'
 * - `quantity > reorderLevel`    -> 'In Stock'
 * 
 * Why this is computed dynamically rather than stored in the database:
 * - Storing a redundant status column can lead to desynchronization bugs if stock
 *   changes without updating the status. Computing on-the-fly guarantees correctness.
 */
export function computeStockStatus(
  quantity: number,
  reorderLevel: number
): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

export class ProductService {
  /**
   * LIST PRODUCTS: Retrieve catalog with search and filters
   * 
   * Features:
   * - By default, filters out archived products (`isArchived: false`).
   * - Joins category and supplier details.
   * - Supports multi-attribute search on name and SKU.
   * - Attaches computed stock status to each product.
   */
  static async listProducts(params: {
    search?: string;
    categoryId?: string;
    status?: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'All';
    includeArchived?: boolean;
  }) {
    const where: any = {
      isArchived: params.includeArchived ? undefined : false,
    };

    if (params.categoryId && params.categoryId !== 'all') {
      where.categoryId = params.categoryId;
    }

    if (params.search && params.search.trim()) {
      const search = params.search.trim();
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      supplierId: p.supplierId,
      supplierName: p.supplier?.name ?? null,
      price: p.price,
      quantity: p.quantity,
      reorderLevel: p.reorderLevel,
      description: p.description,
      status: computeStockStatus(p.quantity, p.reorderLevel),
      isArchived: p.isArchived,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    if (params.status && params.status !== 'All') {
      return mapped.filter(p => p.status === params.status);
    }

    return mapped;
  }

  /**
   * GET PRODUCT BY ID: Fetch single product with recent movement history
   */
  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        transactions: {
          include: {
            performedBy: { select: { id: true, name: true } },
            supplier: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      supplierId: product.supplierId,
      supplierName: product.supplier?.name ?? null,
      price: product.price,
      quantity: product.quantity,
      reorderLevel: product.reorderLevel,
      description: product.description,
      status: computeStockStatus(product.quantity, product.reorderLevel),
      isArchived: product.isArchived,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      transactions: product.transactions.map(t => ({
        id: t.id,
        type: t.type === 'STOCK_IN' ? 'Stock In' : t.type === 'STOCK_OUT' ? 'Stock Out' : 'Adjustment',
        rawType: t.type,
        quantity: t.quantity,
        previousStock: t.previousStock,
        newStock: t.newStock,
        performedBy: t.performedBy.name,
        performedById: t.performedById,
        supplierId: t.supplierId,
        supplierName: t.supplier?.name ?? null,
        reference: t.reference,
        notes: t.notes,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * CREATE PRODUCT WORKFLOW
   * 
   * Safeguards:
   * 1. Normalizes SKU to uppercase (`wm-001` -> `WM-001`).
   * 2. Enforces case-insensitive SKU uniqueness; returns HTTP 409 Conflict on collision.
   * 3. Validates price and reorderLevel are non-negative.
   * 4. Atomic Transaction: If created with `initialStock > 0`, writes both the product
   *    and an initial `STOCK_IN` transaction row atomically within `prisma.$transaction`.
   */
  static async createProduct(
    data: {
      name: string;
      sku: string;
      categoryId: string;
      supplierId?: string | null;
      price: number;
      initialStock?: number;
      reorderLevel: number;
      description?: string;
    },
    userId: string,
    ipAddress?: string
  ) {
    const trimmedName = data.name.trim();
    // 1. Normalize SKU to uppercase
    const normalizedSku = data.sku.trim().toUpperCase();

    if (!trimmedName) throw new AppError('Product name is required.', 400, 'VALIDATION_ERROR');
    if (!normalizedSku) throw new AppError('SKU is required.', 400, 'VALIDATION_ERROR');
    if (data.price < 0) throw new AppError('Price cannot be negative.', 400, 'VALIDATION_ERROR');
    if (data.reorderLevel < 0) throw new AppError('Reorder level cannot be negative.', 400, 'VALIDATION_ERROR');

    const initialStock = Math.max(0, Number(data.initialStock) || 0);

    // 2. Enforce case-insensitive SKU uniqueness
    const existing = await prisma.product.findFirst({
      where: { sku: { equals: normalizedSku } },
    });
    if (existing) {
      throw new AppError(`A product with SKU "${normalizedSku}" already exists.`, 409, 'DUPLICATE_SKU');
    }

    // 3. Verify foreign key reference to Category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new AppError('Selected category does not exist.', 400, 'INVALID_CATEGORY');
    }

    // 4. Atomic transaction for Product creation + Initial Stock Transaction
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: trimmedName,
          sku: normalizedSku,
          categoryId: data.categoryId,
          supplierId: data.supplierId || null,
          price: Number(data.price),
          quantity: initialStock,
          reorderLevel: Number(data.reorderLevel),
          description: data.description?.trim() || null,
        },
      });

      // If created with initial stock, log an immutable initial STOCK_IN record
      if (initialStock > 0) {
        await tx.stockTransaction.create({
          data: {
            productId: product.id,
            type: 'STOCK_IN',
            quantity: initialStock,
            previousStock: 0,
            newStock: initialStock,
            supplierId: data.supplierId || null,
            performedById: userId,
            reference: 'INITIAL_STOCK',
            notes: 'Initial inventory on product creation',
          },
        });
      }

      return product;
    });

    await AuditService.log({
      userId,
      action: 'PRODUCT_CREATE',
      entity: 'PRODUCT',
      entityId: result.id,
      details: { name: result.name, sku: result.sku, initialStock },
      ipAddress,
    });

    return this.getProductById(result.id);
  }

  /**
   * UPDATE PRODUCT WORKFLOW
   * 
   * Invariant: SKU is immutable on update to protect historical transaction traceability.
   */
  static async updateProduct(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      supplierId?: string | null;
      price?: number;
      reorderLevel?: number;
      description?: string;
    },
    userId: string,
    ipAddress?: string
  ) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }

    const updateData: any = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) throw new AppError('Product name cannot be empty.', 400, 'VALIDATION_ERROR');
      updateData.name = trimmed;
    }

    if (data.categoryId !== undefined) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new AppError('Category does not exist.', 400, 'INVALID_CATEGORY');
      updateData.categoryId = data.categoryId;
    }

    if (data.supplierId !== undefined) {
      updateData.supplierId = data.supplierId || null;
    }

    if (data.price !== undefined) {
      if (data.price < 0) throw new AppError('Price cannot be negative.', 400, 'VALIDATION_ERROR');
      updateData.price = Number(data.price);
    }

    if (data.reorderLevel !== undefined) {
      if (data.reorderLevel < 0) throw new AppError('Reorder level cannot be negative.', 400, 'VALIDATION_ERROR');
      updateData.reorderLevel = Number(data.reorderLevel);
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    await AuditService.log({
      userId,
      action: 'PRODUCT_UPDATE',
      entity: 'PRODUCT',
      entityId: id,
      details: { changes: updateData },
      ipAddress,
    });

    return this.getProductById(updated.id);
  }

  /**
   * DELETE PRODUCT WORKFLOW (Soft-Delete / Archival)
   * 
   * Why Soft-Delete (`isArchived = true`) instead of hard SQL `DELETE`?
   * - In an inventory system, products have historical foreign key relationships to
   *   `stock_transactions` and `audit_logs`.
   * - A hard delete would either fail foreign key constraints (`RESTRICT`) or delete
   *   past audit transactions (`CASCADE`), which destroys financial compliance records.
   * - Setting `isArchived = true` hides the product from the active catalog while keeping
   *   all past reports and ledger rows 100% intact.
   */
  static async deleteProduct(id: string, userId: string, ipAddress?: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }

    // Soft delete to preserve historical integrity
    await prisma.product.update({
      where: { id },
      data: { isArchived: true },
    });

    await AuditService.log({
      userId,
      action: 'PRODUCT_ARCHIVE',
      entity: 'PRODUCT',
      entityId: id,
      details: { sku: product.sku, name: product.name },
      ipAddress,
    });

    return { message: 'Product archived successfully.' };
  }
}
