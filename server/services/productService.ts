import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export function computeStockStatus(
  quantity: number,
  reorderLevel: number
): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

export class ProductService {
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
    const normalizedSku = data.sku.trim().toUpperCase();

    if (!trimmedName) throw new AppError('Product name is required.', 400, 'VALIDATION_ERROR');
    if (!normalizedSku) throw new AppError('SKU is required.', 400, 'VALIDATION_ERROR');
    if (data.price < 0) throw new AppError('Price cannot be negative.', 400, 'VALIDATION_ERROR');
    if (data.reorderLevel < 0) throw new AppError('Reorder level cannot be negative.', 400, 'VALIDATION_ERROR');

    const initialStock = Math.max(0, Number(data.initialStock) || 0);

    // Enforce case-insensitive SKU uniqueness
    const existing = await prisma.product.findFirst({
      where: { sku: { equals: normalizedSku } },
    });
    if (existing) {
      throw new AppError(`A product with SKU "${normalizedSku}" already exists.`, 409, 'DUPLICATE_SKU');
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new AppError('Selected category does not exist.', 400, 'INVALID_CATEGORY');
    }

    // Atomic transaction for Product + Initial Stock Transaction
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
