import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';
import { computeStockStatus } from './productService';

class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  acquire<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.queue.then(fn);
    this.queue = result.then(
      () => {},
      () => {}
    );
    return result;
  }
}

const stockLock = new AsyncLock();

export class InventoryService {
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
    const qty = Number(params.quantity);
    if (!qty || qty <= 0) {
      throw new AppError('Quantity must be a positive integer.', 400, 'VALIDATION_ERROR');
    }

    return stockLock.acquire(async () => {
      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: params.productId },
        });

        if (!product || product.isArchived) {
          throw new AppError('Product not found or is archived.', 404, 'NOT_FOUND');
        }

        const previousStock = product.quantity;
        const newStock = previousStock + qty;

        await tx.product.update({
          where: { id: product.id },
          data: { quantity: newStock },
        });

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
    const qty = Number(params.quantity);
    if (!qty || qty <= 0) {
      throw new AppError('Quantity must be a positive integer.', 400, 'VALIDATION_ERROR');
    }

    return stockLock.acquire(async () => {
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

        await tx.product.update({
          where: { id: product.id },
          data: { quantity: newStock },
        });

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
