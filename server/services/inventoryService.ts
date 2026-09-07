/**
 * ============================================================================
 * INVENTORY SERVICE — Core Domain Logic & Concurrency Engine
 * ============================================================================
 * What this module does:
 * - Executes Stock-In (receiving/restocking) and Stock-Out (fulfillment/deduction).
 * - Enforces the strict domain invariant: inventory can NEVER drop below zero.
 * - Prevents race conditions using an in-process Promise-chained Mutex (`AsyncLock`).
 * - Executes all multi-table mutations inside atomic ACID transactions (`prisma.$transaction`).
 * - Writes immutable audit logs and ledger transactions for every inventory movement.
 */

import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';
import { computeStockStatus } from './productService';

/**
 * AsyncLock: In-Memory Concurrency Mutex
 * 
 * Why this exists:
 * - If two HTTP requests attempt to modify stock for the same product at the exact
 *   same millisecond, both could read the initial stock before either writes back.
 * - `AsyncLock` chains operations onto a single FIFO Promise queue, ensuring that
 *   critical stock-out operations are executed sequentially within this Node process.
 * 
 * Trade-off to mention in interviews:
 * - In a single Node.js instance, this in-memory queue eliminates race conditions.
 * - If horizontally scaled to multiple container replicas, distributed locking (Redis Redlock)
 *   or PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) would be required across instances.
 */
class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  acquire<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.queue.then(fn);
    // Keep the queue alive regardless of whether the task succeeded or rejected
    this.queue = result.then(
      () => {},
      () => {}
    );
    return result;
  }
}

// Global instance of the mutex for inventory operations
const stockLock = new AsyncLock();

export class InventoryService {
  /**
   * STOCK-IN WORKFLOW: Restock inventory
   * 
   * Steps:
   * 1. Validate that quantity is a positive integer.
   * 2. Acquire concurrency lock.
   * 3. Start ACID database transaction:
   *    a. Read current product quantity.
   *    b. Calculate newStock = previousStock + quantity.
   *    c. Update product quantity in `products` table.
   *    d. Insert an immutable `stock_transactions` record for audit trail.
   * 4. Log high-level audit record in `audit_logs` table.
   * 5. Return updated product details and freshly calculated stock status.
   */
  static async stockIn(
    params: {
      productId: string;
      quantity: number;
      supplierId?: string | null;
      reference?: string;
      notes?: string;
    },
    userId: string,
    ipAddress?: string
  ) {
    // 1. Validate input
    const qty = Number(params.quantity);
    if (!qty || qty <= 0) {
      throw new AppError('Quantity must be a positive integer.', 400, 'VALIDATION_ERROR');
    }

    // 2. Serialize execution through AsyncLock to prevent race conditions
    return stockLock.acquire(async () => {
      // 3. Begin atomic database transaction (all or nothing)
      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: params.productId },
        });

        if (!product || product.isArchived) {
          throw new AppError('Product not found or is archived.', 404, 'NOT_FOUND');
        }

        const previousStock = product.quantity;
        const newStock = previousStock + qty;

        // Update product stock count
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: newStock },
        });

        // Create immutable ledger record
        const txn = await tx.stockTransaction.create({
          data: {
            productId: product.id,
            type: 'STOCK_IN',
            quantity: qty,
            previousStock,
            newStock,
            supplierId: params.supplierId || product.supplierId || null,
            performedById: userId,
            reference: params.reference?.trim() || null,
            notes: params.notes?.trim() || null,
          },
        });

        return { product, txn, previousStock, newStock };
      });

      // 4. Record audit log outside transaction so business operation is already committed
      await AuditService.log({
        userId,
        action: 'STOCK_IN',
        entity: 'INVENTORY',
        entityId: result.product.id,
        details: {
          product: result.product.name,
          sku: result.product.sku,
          quantity: qty,
          previousStock: result.previousStock,
          newStock: result.newStock,
          transactionId: result.txn.id,
        },
        ipAddress,
      });

      // 5. Return response with dynamically computed stock status
      return {
        transactionId: result.txn.id,
        productId: result.product.id,
        productName: result.product.name,
        previousStock: result.previousStock,
        newStock: result.newStock,
        status: computeStockStatus(result.newStock, result.product.reorderLevel),
      };
    });
  }

  /**
   * STOCK-OUT WORKFLOW: Deduct inventory for fulfillment
   * 
   * Critical Business Rule (Negative Stock Prevention):
   * - `product.quantity >= quantity`. If requested quantity exceeds available stock,
   *   an `AppError` with code `INSUFFICIENT_STOCK` is thrown immediately.
   * - Because this is inside `prisma.$transaction`, throwing an error automatically
   *   ROLLS BACK the transaction: zero database mutations occur.
   */
  static async stockOut(
    params: {
      productId: string;
      quantity: number;
      reference?: string;
      notes?: string;
    },
    userId: string,
    ipAddress?: string
  ) {
    // 1. Input validation
    const qty = Number(params.quantity);
    if (!qty || qty <= 0) {
      throw new AppError('Quantity must be a positive integer.', 400, 'VALIDATION_ERROR');
    }

    // 2. Serialize through AsyncLock
    return stockLock.acquire(async () => {
      // 3. Begin atomic database transaction
      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: params.productId },
        });

        if (!product || product.isArchived) {
          throw new AppError('Product not found or is archived.', 404, 'NOT_FOUND');
        }

        // CRITICAL BUSINESS INVARIANT: Zero negative stock allowed
        if (product.quantity < qty) {
          throw new AppError(
            `Insufficient stock. Only ${product.quantity} units are available.`,
            400,
            'INSUFFICIENT_STOCK',
            { available: product.quantity, requested: qty }
          );
        }

        const previousStock = product.quantity;
        const newStock = previousStock - qty;

        // Deduct inventory in database
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: newStock },
        });

        // Insert immutable stock transaction ledger row
        const txn = await tx.stockTransaction.create({
          data: {
            productId: product.id,
            type: 'STOCK_OUT',
            quantity: qty,
            previousStock,
            newStock,
            supplierId: null,
            performedById: userId,
            reference: params.reference?.trim() || null,
            notes: params.notes?.trim() || null,
          },
        });

        return { product, txn, previousStock, newStock };
      });

      // 4. Record audit log
      await AuditService.log({
        userId,
        action: 'STOCK_OUT',
        entity: 'INVENTORY',
        entityId: result.product.id,
        details: {
          product: result.product.name,
          sku: result.product.sku,
          quantity: qty,
          previousStock: result.previousStock,
          newStock: result.newStock,
          transactionId: result.txn.id,
        },
        ipAddress,
      });

      // 5. Return updated stock and newly calculated status (e.g., 'Low Stock' or 'Out of Stock')
      return {
        transactionId: result.txn.id,
        productId: result.product.id,
        productName: result.product.name,
        previousStock: result.previousStock,
        newStock: result.newStock,
        status: computeStockStatus(result.newStock, result.product.reorderLevel),
      };
    });
  }

  /**
   * LIST INVENTORY: Retrieve live stock catalog with computed statuses
   * 
   * Features:
   * - Ignores archived products (`isArchived: false`).
   * - Supports category filtering and case-insensitive search by product name or SKU.
   * - Performs relational JOIN with `categories` and `suppliers` via Prisma `include`.
   * - Dynamically computes product stock status (`In Stock`, `Low Stock`, `Out of Stock`)
   *   by comparing `currentStock` against `reorderLevel`.
   */
  static async listInventory(params?: {
    search?: string;
    categoryId?: string;
    status?: string;
  }) {
    const where: any = { isArchived: false };

    if (params?.categoryId && params.categoryId !== 'all') {
      where.categoryId = params.categoryId;
    }

    if (params?.search && params.search.trim()) {
      const s = params.search.trim();
      where.OR = [{ name: { contains: s } }, { sku: { contains: s } }];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });

    const mapped = products.map(p => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      categoryName: p.category.name,
      supplierName: p.supplier?.name ?? null,
      currentStock: p.quantity,
      reorderLevel: p.reorderLevel,
      status: computeStockStatus(p.quantity, p.reorderLevel),
    }));

    if (params?.status && params.status !== 'All') {
      return mapped.filter(p => p.status === params.status);
    }

    return mapped;
  }

  /**
   * LIST TRANSACTIONS: Retrieve immutable stock movement audit ledger
   * 
   * Features:
   * - Returns historical record of all STOCK_IN and STOCK_OUT movements.
   * - Includes performedBy user information and supplier details.
   * - Sorted descending by creation time (most recent activity first).
   */
  static async listTransactions(params?: {
    type?: string;
    productId?: string;
    limit?: number;
  }) {
    const where: any = {};

    if (params?.type && params.type !== 'all') {
      const upper = params.type.toUpperCase().replace(/\s+/g, '_');
      where.type = upper;
    }

    if (params?.productId) {
      where.productId = params.productId;
    }

    const txns = await prisma.stockTransaction.findMany({
      where,
      include: {
        product: true,
        supplier: true,
        performedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 100,
    });

    return txns.map(t => ({
      id: t.id,
      productId: t.productId,
      productName: t.product.name,
      sku: t.product.sku,
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
    }));
  }

  /**
   * GET TRANSACTION BY ID: Retrieve single transaction receipt
   */
  static async getTransactionById(id: string) {
    const txn = await prisma.stockTransaction.findUnique({
      where: { id },
      include: {
        product: { include: { category: true } },
        supplier: true,
        performedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!txn) {
      throw new AppError('Transaction not found.', 404, 'NOT_FOUND');
    }

    return {
      id: txn.id,
      productId: txn.productId,
      productName: txn.product.name,
      sku: txn.product.sku,
      categoryName: txn.product.category.name,
      type: txn.type === 'STOCK_IN' ? 'Stock In' : txn.type === 'STOCK_OUT' ? 'Stock Out' : 'Adjustment',
      rawType: txn.type,
      quantity: txn.quantity,
      previousStock: txn.previousStock,
      newStock: txn.newStock,
      performedBy: txn.performedBy.name,
      performedById: txn.performedById,
      supplierId: txn.supplierId,
      supplierName: txn.supplier?.name ?? null,
      reference: txn.reference,
      notes: txn.notes,
      createdAt: txn.createdAt,
    };
  }
}
