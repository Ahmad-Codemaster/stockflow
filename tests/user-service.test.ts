import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin } from './setup';

describe('User Service & Product Filters In-depth', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('fetches user by ID and updates user properties', async () => {
    const { cookie } = await loginAsAdmin();

    // 1. Get user by id
    const getRes = await request(app).get('/api/users/u2').set('Cookie', [cookie]);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Ali Raza');

    // 2. Update user
    const updateRes = await request(app)
      .put('/api/users/u2')
      .set('Cookie', [cookie])
      .send({
        name: 'Ali Raza Updated',
        role: 'ADMIN',
        password: 'NewStaffPassword@123',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Ali Raza Updated');
    expect(updateRes.body.data.role).toBe('ADMIN');

    // 3. Reject duplicate email update
    const dupRes = await request(app)
      .put('/api/users/u2')
      .set('Cookie', [cookie])
      .send({ email: 'ahmad@stockflow.com' });
    expect(dupRes.status).toBe(409);
  });

  it('filters product catalog by category, search term, and status', async () => {
    const { cookie } = await loginAsAdmin();

    // Category filter
    const catRes = await request(app).get('/api/products?categoryId=c1').set('Cookie', [cookie]);
    expect(catRes.status).toBe(200);
    for (const p of catRes.body.data) {
      expect(p.categoryId).toBe('c1');
    }

    // Search filter
    const searchRes = await request(app).get('/api/products?search=Mouse').set('Cookie', [cookie]);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThan(0);
    expect(searchRes.body.data[0].name).toContain('Mouse');

    // Status filter
    const statusRes = await request(app).get('/api/products?status=Low Stock').set('Cookie', [cookie]);
    expect(statusRes.status).toBe(200);
    for (const p of statusRes.body.data) {
      expect(p.status).toBe('Low Stock');
    }
  });

  it('returns 404 for nonexistent product or category', async () => {
    const { cookie } = await loginAsAdmin();

    const pRes = await request(app).get('/api/products/nonexistent-id').set('Cookie', [cookie]);
    expect(pRes.status).toBe(404);

    const cRes = await request(app).put('/api/categories/nonexistent-id').set('Cookie', [cookie]).send({ name: 'Test' });
    expect(cRes.status).toBe(404);

    const sRes = await request(app).put('/api/suppliers/nonexistent-id').set('Cookie', [cookie]).send({ name: 'Test' });
    expect(sRes.status).toBe(404);
  });
});
