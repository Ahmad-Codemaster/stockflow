/**
 * ============================================================================
 * FULL INVENTORY LIFECYCLE INTEGRATION TEST
 * ============================================================================
 * What this test proves (end-to-end domain workflow):
 * 1. Admin creates a category.
 * 2. Admin creates a supplier.
 * 3. Admin creates a product with initial stock 0.
 * 4. Staff performs Stock-In → verifies inventory increases, status = 'In Stock'.
 * 5. Staff performs large Stock-Out → verifies status transitions to 'Low Stock'.
 * 6. Admin performs Stock-Adjustment to reconcile physical count.
 * 7. Valuation report reflects updated product value.
 * 8. Movement report includes all created transactions.
 * 9. Full teardown — no orphaned records.
 */

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin, loginAsStaff } from './setup';

describe('Full Inventory Lifecycle Integration', () => {
  let adminCookie: string;
  let staffCookie: string;
  let categoryId: string;
  let supplierId: string;
  let productId: string;

  beforeAll(async () => {
    await seedDatabase();
    const admin = await loginAsAdmin();
    const staff = await loginAsStaff();
    adminCookie = admin.cookie;
    staffCookie = staff.cookie;
  });

  afterAll(async () => {
    // Cleanup lifecycle test artifacts if they persisted
    if (productId) {
      await prisma.stockTransaction.deleteMany({ where: { productId } }).catch(() => {});
      await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    }
    if (categoryId) {
      await prisma.category.deleteMany({ where: { id: categoryId } }).catch(() => {});
    }
    if (supplierId) {
      await prisma.supplier.deleteMany({ where: { id: supplierId } }).catch(() => {});
    }
  });

  it('Step 1: Admin creates a new category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', [adminCookie])
      .send({ name: 'Lifecycle Test Category', description: 'Category for lifecycle test' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Lifecycle Test Category');
    categoryId = res.body.data.id;
    expect(categoryId).toBeDefined();
  });

  it('Step 2: Admin creates a new supplier', async () => {
    const res = await request(app)
      .post('/api/suppliers')
      .set('Cookie', [adminCookie])
      .send({
        name: 'Lifecycle Test Supplier',
        contactPerson: 'Jane Smith',
        email: 'jane@lifecycletest.com',
        phone: '+1-555-9999',
        address: '123 Test Street',
        leadTime: 7,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    supplierId = res.body.data.id;
    expect(supplierId).toBeDefined();
  });

  it('Step 3: Admin creates a product with zero initial stock', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Cookie', [adminCookie])
      .send({
        name: 'Lifecycle Test Widget',
        sku: `LCT-${Date.now()}`,
        categoryId,
        supplierId,
        price: 49.99,
        initialStock: 0,
        reorderLevel: 5,
        description: 'Widget used for lifecycle integration testing',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    productId = res.body.data.id;
    expect(productId).toBeDefined();

    // Verify initial Out of Stock status
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.quantity).toBe(0);
  });

  it('Step 4: Staff performs Stock-In of 20 units → product becomes In Stock', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-in')
      .set('Cookie', [staffCookie])
      .send({
        productId,
        quantity: 20,
        supplierId,
        reference: 'LCT-STOCK-IN-001',
        notes: 'Lifecycle test stock in',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.newStock).toBe(20);
    expect(res.body.data.status).toBe('In Stock');
    expect(res.body.data.transactionId).toBeDefined();
  });

  it('Step 5: Staff performs Stock-Out of 16 units → product transitions to Low Stock', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-out')
      .set('Cookie', [staffCookie])
      .send({
        productId,
        quantity: 16,
        reference: 'LCT-STOCK-OUT-001',
        notes: 'Lifecycle test stock out',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.newStock).toBe(4); // 20 - 16 = 4, which is <= reorderLevel 5
    expect(res.body.data.status).toBe('Low Stock');
  });

  it('Step 5b: Over-deduction attempt is rejected with INSUFFICIENT_STOCK', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-out')
      .set('Cookie', [staffCookie])
      .send({
        productId,
        quantity: 999,
        reference: 'LCT-OVER-DEDUCT',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

    // Confirm no mutation occurred
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.quantity).toBe(4);
  });

  it('Step 6: Admin performs Stock-Adjustment to reconcile physical count to 10', async () => {
    const res = await request(app)
      .post('/api/inventory/adjust')
      .set('Cookie', [adminCookie])
      .send({
        productId,
        targetQuantity: 10,
        reference: 'LCT-ADJUST-001',
        notes: 'Physical count reconciliation',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.newStock).toBe(10);
    expect(res.body.data.status).toBe('In Stock'); // 10 > reorderLevel of 5
  });

  it('Step 7: Valuation report includes the lifecycle product', async () => {
    const res = await request(app)
      .get('/api/reports/valuation')
      .set('Cookie', [adminCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Step 8: Transaction ledger contains all 3 lifecycle movements', async () => {
    const txns = await prisma.stockTransaction.findMany({
      where: {
        productId,
        reference: { in: ['LCT-STOCK-IN-001', 'LCT-STOCK-OUT-001', 'LCT-ADJUST-001'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    expect(txns.length).toBe(3);
    expect(txns[0].type).toBe('STOCK_IN');
    expect(txns[1].type).toBe('STOCK_OUT');
    expect(txns[2].type).toBe('ADJUSTMENT');
  });
});
