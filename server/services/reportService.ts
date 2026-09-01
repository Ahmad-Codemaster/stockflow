import prisma from '../db';
import { computeStockStatus } from './productService';

export class ReportService {
  static async getSummary() {
    const products = await prisma.product.findMany({
      where: { isArchived: false },
      include: { category: true },
    });

    const categoriesCount = await prisma.category.count();
    const suppliersCount = await prisma.supplier.count();
    const totalTransactions = await prisma.stockTransaction.count();

    let totalStockUnits = 0;
    let totalValuation = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalStockUnits += p.quantity;
      totalValuation += p.quantity * p.price;
      const status = computeStockStatus(p.quantity, p.reorderLevel);
      if (status === 'In Stock') inStockCount++;
      else if (status === 'Low Stock') lowStockCount++;
      else if (status === 'Out of Stock') outOfStockCount++;
    }

    return {
      totalProducts: products.length,
      totalStockUnits,
      totalValuation: Math.round(totalValuation * 100) / 100,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      categoriesCount,
      suppliersCount,
      totalTransactions,
    };
  }

  static async getMovement() {
    const transactions = await prisma.stockTransaction.findMany({
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let totalIn = 0;
    let totalOut = 0;
    let totalAdjustments = 0;

    for (const t of transactions) {
      if (t.type === 'STOCK_IN') totalIn += t.quantity;
      else if (t.type === 'STOCK_OUT') totalOut += t.quantity;
      else if (t.type === 'ADJUSTMENT') totalAdjustments += t.quantity;
    }

    return {
      totalIn,
      totalOut,
      totalAdjustments,
      recentMovements: transactions.map(t => ({
        id: t.id,
        productId: t.productId,
        productName: t.product.name,
        sku: t.product.sku,
        type: t.type === 'STOCK_IN' ? 'Stock In' : t.type === 'STOCK_OUT' ? 'Stock Out' : 'Adjustment',
        quantity: t.quantity,
        previousStock: t.previousStock,
        newStock: t.newStock,
        createdAt: t.createdAt,
      })),
    };
  }

  static async getLowStock() {
    const products = await prisma.product.findMany({
      where: { isArchived: false },
      include: { category: true, supplier: true },
      orderBy: { quantity: 'asc' },
    });

    return products
      .filter(p => p.quantity <= p.reorderLevel)
      .map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        categoryName: p.category.name,
        supplierName: p.supplier?.name ?? '—',
        currentStock: p.quantity,
        reorderLevel: p.reorderLevel,
        status: computeStockStatus(p.quantity, p.reorderLevel),
      }));
  }

  static async getValuation() {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          where: { isArchived: false },
        },
      },
    });

    return categories.map(c => {
      const itemCount = c.products.reduce((acc, p) => acc + p.quantity, 0);
      const totalValue = c.products.reduce((acc, p) => acc + p.quantity * p.price, 0);
      return {
        categoryId: c.id,
        categoryName: c.name,
        productCount: c.products.length,
        itemCount,
        totalValue: Math.round(totalValue * 100) / 100,
      };
    });
  }
}
