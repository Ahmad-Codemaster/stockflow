import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin } from './setup';

describe('Products CRUD & Business Rules', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('creates a new product and initial stock transaction atomically', async () => {
    const { cookie } = await loginAsAdmin();

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', [cookie])
      .send({
        name: 'Gaming Headset',
        sku: 'gh-101',
        categoryId: 'c4',
        supplierId: 's3',
        price: 149.99,
        reorderLevel: 8,
        initialStock: 15,
        description: 'Noise cancelling spatial audio headset',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sku).toBe('GH-101'); // Normalized uppercase
    expect(res.body.data.quantity).toBe(15);
    expect(res.body.data.status).toBe('In Stock');

    // Verify initial stock transaction in DB
    const txns = await prisma.stockTransaction.findMany({
      where: { productId: res.body.data.id },
    });
    expect(txns.length).toBe(1);
    expect(txns[0].type).toBe('STOCK_IN');
    expect(txns[0].quantity).toBe(15);
    expect(txns[0].previousStock).toBe(0);
    expect(txns[0].newStock).toBe(15);
  });

  it('rejects duplicate SKU creation (case-insensitive) with 409 Conflict', async () => {
    const { cookie } = await loginAsAdmin();

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', [cookie])
      .send({
        name: 'Another Mouse',
        sku: 'wm-001', // Already exists as WM-001
        categoryId: 'c1',
        price: 30,
        reorderLevel: 5,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_SKU');
  });

  it('updates product attributes while keeping SKU immutable', async () => {
    const { cookie } = await loginAsAdmin();

    const res = await request(app)
      .put('/api/products/p1')
      .set('Cookie', [cookie])
      .send({
        name: 'Updated Wireless Mouse V2',
        price: 34.99,
        reorderLevel: 12,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Wireless Mouse V2');
    expect(res.body.data.price).toBe(34.99);
    expect(res.body.data.sku).toBe('WM-001'); // Preserved original SKU
  });

  it('soft-deletes (archives) product on delete and hides from default catalog', async () => {
    const { cookie } = await loginAsAdmin();

    const deleteRes = await request(app)
      .delete('/api/products/p1')
      .set('Cookie', [cookie]);

    expect(deleteRes.status).toBe(200);

    // Verify row still exists in DB with isArchived = true
    const dbProduct = await prisma.product.findUnique({ where: { id: 'p1' } });
    expect(dbProduct?.isArchived).toBe(true);

    // Verify omitted from active product list
    const listRes = await request(app)
      .get('/api/products')
      .set('Cookie', [cookie]);

    const found = listRes.body.data.find((p: any) => p.id === 'p1');
    expect(found).toBeUndefined();
  });
});
