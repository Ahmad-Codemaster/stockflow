/**
 * ============================================================================
 * INVENTORY SERVICE — Core Domain Logic & Concurrency Engine
 * ============================================================================
 * What this module does:
 * - Executes Stock-In (receiving/restocking) and Stock-Out (fulfillment/deduction).
 * - Enforces the strict domain invariant: inventory can NEVER drop below zero.
 * - Prevents race conditions across instances using PostgreSQL row-level locking (`SELECT ... FOR UPDATE`).
 * - Executes all multi-table mutations inside atomic ACID transactions (`prisma.$transaction`).
 * - Writes immutable audit logs and ledger transactions for every inventory movement.
 */

import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';
import { computeStockStatus } from './productService';

export class InventoryService {
  /**
   * STOCK-IN WORKFLOW: Restock inventory
   * 
   * Concurrency & Atomicity:
   * - Uses PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) inside an ACID transaction.
   * - Serializes concurrent updates to the same product across all application instances.
   * - Ledger transaction and audit log are committed atomically together.
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

    // 2. Execute within an atomic transaction with row-level locking
    const result = await prisma.$transaction(async (tx) => {
      // Row-level lock: prevents concurrent mutations on this product across all instances
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          sku: string;
          categoryId: string;
          supplierId: string | null;
          price: number;
          quantity: number;
          reorderLevel: number;
          isArchived: boolean;
        }>
      >`
        SELECT 
          id,
          name,
          sku,
          category_id AS "categoryId",
          supplier_id AS "supplierId",
          price,
          quantity,
          reorder_level AS "reorderLevel",
          is_archived AS "isArchived"
        FROM products
        WHERE id = ${params.productId}
        FOR UPDATE
      `;

      const product = rows[0];
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

      // Record audit log atomically INSIDE transaction
      await AuditService.log(
        {
          userId,
          action: 'STOCK_IN',
          entity: 'INVENTORY',
          entityId: product.id,
          details: {
            product: product.name,
            sku: product.sku,
            quantity: qty,
            previousStock,
            newStock,
            transactionId: txn.id,
          },
          ipAddress,
        },
        tx
      );

      return { product, txn, previousStock, newStock };
    });

    // 3. Return response with dynamically computed stock status
    return {
      transactionId: result.txn.id,
      productId: result.product.id,
      productName: result.product.name,
      previousStock: result.previousStock,
      newStock: result.newStock,
      status: computeStockStatus(result.newStock, result.product.reorderLevel),
    };
  }

  /**
   * STOCK-OUT WORKFLOW: Deduct inventory for fulfillment
   * 
   * Concurrency & Atomicity:
   * - Row-level locking (`SELECT ... FOR UPDATE`) prevents lost updates and over-deduction race conditions.
   * - Invariant `product.quantity >= quantity` verified under row lock.
   * - Negative stock prevention enforced at both application layer and DB CHECK constraint level.
   * - If stock is insufficient, throws AppError which automatically rolls back the transaction.
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

    // 2. Execute within atomic transaction with row-level locking
    const result = await prisma.$transaction(async (tx) => {
      // Row-level lock: acquires exclusive row lock on this product row
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          sku: string;
          categoryId: string;
          supplierId: string | null;
          price: number;
          quantity: number;
          reorderLevel: number;
          isArchived: boolean;
        }>
      >`
        SELECT 
          id,
          name,
          sku,
          category_id AS "categoryId",
          supplier_id AS "supplierId",
          price,
          quantity,
          reorder_level AS "reorderLevel",
          is_archived AS "isArchived"
        FROM products
        WHERE id = ${params.productId}
        FOR UPDATE
      `;

      const product = rows[0];
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

      // Record audit log atomically INSIDE transaction
      await AuditService.log(
        {
          userId,
          action: 'STOCK_OUT',
          entity: 'INVENTORY',
          entityId: product.id,
          details: {
            product: product.name,
            sku: product.sku,
            quantity: qty,
            previousStock,
            newStock,
            transactionId: txn.id,
          },
          ipAddress,
        },
        tx
      );

      return { product, txn, previousStock, newStock };
    });

    // 3. Return updated stock and newly calculated status (e.g., 'Low Stock' or 'Out of Stock')
    return {
      transactionId: result.txn.id,
      productId: result.product.id,
      productName: result.product.name,
      previousStock: result.previousStock,
      newStock: result.newStock,
      status: computeStockStatus(result.newStock, result.product.reorderLevel),
    };
  }

  /**
   * STOCK-ADJUSTMENT WORKFLOW: Reconcile physical inventory counts / shrinkage / audit adjustments
   * 
   * Features:
   * - Supports targetQuantity (absolute stock count) or quantity delta (+/-).
   * - Uses PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) inside an ACID transaction.
   * - Enforces non-negative inventory invariant.
   * - Records immutable 'ADJUSTMENT' transaction record.
   * - Records atomic 'STOCK_ADJUSTMENT' audit log.
   */
  static async stockAdjustment(
    params: {
      productId: string;
      targetQuantity?: number;
      quantity?: number;
      reference?: string;
      notes?: string;
    },
    userId: string,
    ipAddress?: string
  ) {
    if (params.targetQuantity === undefined && params.quantity === undefined) {
      throw new AppError('Either targetQuantity or quantity delta must be provided.', 400, 'VALIDATION_ERROR');
    }

    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          sku: string;
          categoryId: string;
          supplierId: string | null;
          price: number;
          quantity: number;
          reorderLevel: number;
          isArchived: boolean;
        }>
      >`
        SELECT 
          id,
          name,
          sku,
          category_id AS "categoryId",
          supplier_id AS "supplierId",
          price,
          quantity,
          reorder_level AS "reorderLevel",
          is_archived AS "isArchived"
        FROM products
        WHERE id = ${params.productId}
        FOR UPDATE
      `;

      const product = rows[0];
      if (!product || product.isArchived) {
        throw new AppError('Product not found or is archived.', 404, 'NOT_FOUND');
      }

      const previousStock = product.quantity;
      let newStock: number;
      let delta: number;

      if (params.targetQuantity !== undefined) {
        newStock = Number(params.targetQuantity);
        delta = newStock - previousStock;
      } else {
        delta = Number(params.quantity);
        newStock = previousStock + delta;
      }

      if (newStock < 0) {
        throw new AppError(
          `Adjustment would result in negative stock (${newStock}).`,
          400,
          'INSUFFICIENT_STOCK',
          { available: previousStock, target: newStock, delta }
        );
      }

      // Update product stock
      await tx.product.update({
        where: { id: product.id },
        data: { quantity: newStock },
      });

      // Create ledger entry
      const txn = await tx.stockTransaction.create({
        data: {
          productId: product.id,
          type: 'ADJUSTMENT',
          quantity: Math.abs(delta),
          previousStock,
          newStock,
          supplierId: product.supplierId || null,
          performedById: userId,
          reference: params.reference?.trim() || null,
          notes: params.notes?.trim() || null,
        },
      });

      // Atomic audit logging
      await AuditService.log(
        {
          userId,
          action: 'STOCK_ADJUSTMENT',
          entity: 'INVENTORY',
          entityId: product.id,
          details: {
            product: product.name,
            sku: product.sku,
            previousStock,
            newStock,
            delta,
            transactionId: txn.id,
            notes: params.notes,
          },
          ipAddress,
        },
        tx
      );

      return { product, txn, previousStock, newStock, delta };
    });

    return {
      transactionId: result.txn.id,
      productId: result.product.id,
      productName: result.product.name,
      previousStock: result.previousStock,
      newStock: result.newStock,
      delta: result.delta,
      status: computeStockStatus(result.newStock, result.product.reorderLevel),
    };
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
