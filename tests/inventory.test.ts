import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsStaff } from './setup';

describe('Inventory Transactions & Stock Invariants', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('Stock-In increases inventory and creates an immutable transaction record atomically', async () => {
    const { cookie } = await loginAsStaff();

    // p1 starts with 4 units
    const res = await request(app)
      .post('/api/inventory/stock-in')
      .set('Cookie', [cookie])
      .send({
        productId: 'p1',
        quantity: 10,
        reference: 'PO-TEST-001',
        notes: 'Restock test batch',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.previousStock).toBe(4);
    expect(res.body.data.newStock).toBe(14);
    expect(res.body.data.status).toBe('In Stock'); // reorderLevel is 10, stock is 14 -> In Stock

    // Verify DB product quantity
    const dbProduct = await prisma.product.findUnique({ where: { id: 'p1' } });
    expect(dbProduct?.quantity).toBe(14);

    // Verify DB transaction
    const dbTxn = await prisma.stockTransaction.findUnique({
      where: { id: res.body.data.transactionId },
    });
    expect(dbTxn).toBeDefined();
    expect(dbTxn?.type).toBe('STOCK_IN');
    expect(dbTxn?.quantity).toBe(10);
    expect(dbTxn?.performedById).toBe('u2'); // Ali Raza
  });

  it('Stock-Out decreases inventory and transitions status from In Stock to Low Stock', async () => {
    const { cookie } = await loginAsStaff();

    // p2 starts with 23 units, reorderLevel = 5
    const res = await request(app)
      .post('/api/inventory/stock-out')
      .set('Cookie', [cookie])
      .send({
        productId: 'p2',
        quantity: 19,
        reference: 'SO-TEST-001',
        notes: 'Large order fulfillment',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.previousStock).toBe(23);
    expect(res.body.data.newStock).toBe(4);
    expect(res.body.data.status).toBe('Low Stock'); // 4 <= 5 -> Low Stock

    const dbProduct = await prisma.product.findUnique({ where: { id: 'p2' } });
    expect(dbProduct?.quantity).toBe(4);
  });

  it('Stock-Out fails with 400 INSUFFICIENT_STOCK when quantity exceeds available stock; zero mutation occurs', async () => {
    const { cookie } = await loginAsStaff();

    // p1 starts with 4 units; attempt to withdraw 5 units
    const res = await request(app)
      .post('/api/inventory/stock-out')
      .set('Cookie', [cookie])
      .send({
        productId: 'p1',
        quantity: 5,
        reference: 'SO-OVERFLOW',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.error.message).toContain('Insufficient stock. Only 4 units are available.');

    // Invariant check: product quantity MUST remain exactly 4
    const dbProduct = await prisma.product.findUnique({ where: { id: 'p1' } });
    expect(dbProduct?.quantity).toBe(4);

    // Invariant check: no stock_transaction created
    const txns = await prisma.stockTransaction.findMany({
      where: { reference: 'SO-OVERFLOW' },
    });
    expect(txns.length).toBe(0);
  });

  it('correctly computes status transitions to Out of Stock when quantity reaches 0', async () => {
    const { cookie } = await loginAsStaff();

    // p1 has 4 units; withdraw all 4 units
    const res = await request(app)
      .post('/api/inventory/stock-out')
      .set('Cookie', [cookie])
      .send({
        productId: 'p1',
        quantity: 4,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.newStock).toBe(0);
    expect(res.body.data.status).toBe('Out of Stock');
  });
});
