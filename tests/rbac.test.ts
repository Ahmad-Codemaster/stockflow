import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin, loginAsStaff } from './setup';

describe('Role-Based Access Control (RBAC) Enforcement', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('Staff user CAN access inventory, dashboard, and reports endpoints', async () => {
    const { cookie } = await loginAsStaff();

    const invRes = await request(app).get('/api/inventory').set('Cookie', [cookie]);
    expect(invRes.status).toBe(200);

    const prodRes = await request(app).get('/api/products').set('Cookie', [cookie]);
    expect(prodRes.status).toBe(200);

    const reportRes = await request(app).get('/api/reports/summary').set('Cookie', [cookie]);
    expect(reportRes.status).toBe(200);
  });

  it('Staff user CAN record Stock-In and Stock-Out operations', async () => {
    const { cookie } = await loginAsStaff();

    const stockInRes = await request(app)
      .post('/api/inventory/stock-in')
      .set('Cookie', [cookie])
      .send({ productId: 'p1', quantity: 2 });
    expect(stockInRes.status).toBe(200);

    const stockOutRes = await request(app)
      .post('/api/inventory/stock-out')
      .set('Cookie', [cookie])
      .send({ productId: 'p1', quantity: 1 });
    expect(stockOutRes.status).toBe(200);
  });

  it('Staff user is REJECTED (403 Forbidden) when accessing user management GET /api/users', async () => {
    const { cookie } = await loginAsStaff();

    const res = await request(app).get('/api/users').set('Cookie', [cookie]);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Staff user is REJECTED (403 Forbidden) when creating a product POST /api/products', async () => {
    const { cookie } = await loginAsStaff();

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', [cookie])
      .send({
        name: 'Staff Unauthorized Product',
        sku: 'STAFF-001',
        categoryId: 'c1',
        price: 10,
        reorderLevel: 5,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Staff user is REJECTED (403 Forbidden) when managing categories POST /api/categories', async () => {
    const { cookie } = await loginAsStaff();

    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', [cookie])
      .send({ name: 'Staff Unauthorized Category' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Admin user CAN access user management and create products', async () => {
    const { cookie } = await loginAsAdmin();

    const usersRes = await request(app).get('/api/users').set('Cookie', [cookie]);
    expect(usersRes.status).toBe(200);
    expect(Array.isArray(usersRes.body.data)).toBe(true);

    const prodRes = await request(app)
      .post('/api/products')
      .set('Cookie', [cookie])
      .send({
        name: 'Admin Authorized Product',
        sku: 'ADM-001',
        categoryId: 'c1',
        price: 99.99,
        reorderLevel: 5,
      });

    expect(prodRes.status).toBe(201);
    expect(prodRes.body.data.sku).toBe('ADM-001');
  });
});
