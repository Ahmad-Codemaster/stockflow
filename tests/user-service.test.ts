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

  it('enforces last-admin protection guard preventing demotion or deactivation of the last active admin', async () => {
    const { cookie } = await loginAsAdmin();

    // 1. Delete u0 so only u1 remains as the sole active admin
    await request(app).delete('/api/users/u0').set('Cookie', [cookie]);

    // 2. Create a temporary second admin
    const createRes = await request(app)
      .post('/api/users')
      .set('Cookie', [cookie])
      .send({
        name: 'Temp Admin',
        email: 'tempadmin@stockflow.com',
        role: 'ADMIN',
        password: 'AdminPassword@123',
      });
    const tempAdminId = createRes.body.data.id;

    // Login as temp admin so we can act on u1
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tempadmin@stockflow.com', password: 'AdminPassword@123' });
    const tempCookie = loginRes.headers['set-cookie'][0];

    // Delete u1 so tempAdmin is now the SOLE active admin
    await request(app).delete('/api/users/u1').set('Cookie', [tempCookie]);

    // Attempt to demote tempAdmin (last admin) to STAFF -> should fail with 400 LAST_ADMIN
    const demoteRes = await request(app)
      .put(`/api/users/${tempAdminId}`)
      .set('Cookie', [tempCookie])
      .send({ role: 'STAFF' });
    expect(demoteRes.status).toBe(400);
    expect(demoteRes.body.error.code).toBe('LAST_ADMIN');

    // Attempt to deactivate tempAdmin (last admin) -> should fail with 400 LAST_ADMIN
    const deactRes = await request(app)
      .put(`/api/users/${tempAdminId}`)
      .set('Cookie', [tempCookie])
      .send({ status: 'Inactive' });
    expect(deactRes.status).toBe(400);
    expect(deactRes.body.error.code).toBe('LAST_ADMIN');
  });

  it('prevents concurrent admin deletion from leaving zero active administrators', async () => {
    // 1. Ensure exactly 2 active administrators exist (u0 and u1)
    const activeAdminsInitial = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'Active' },
    });
    expect(activeAdminsInitial.length).toBeGreaterThanOrEqual(2);

    const adminA = activeAdminsInitial[0];
    const adminB = activeAdminsInitial[1];

    // Login as Admin A and Admin B to get their respective auth cookies
    const loginARes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminA.email, password: 'Admin@123' });
    const cookieA = loginARes.headers['set-cookie'][0];

    const loginBRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminB.email, password: 'Admin@123' });
    const cookieB = loginBRes.headers['set-cookie'][0];

    // If there are more than 2 active admins in fixtures, prune extra admins down to exactly 2
    for (let i = 2; i < activeAdminsInitial.length; i++) {
      await request(app).delete(`/api/users/${activeAdminsInitial[i].id}`).set('Cookie', [cookieA]);
    }

    const exactTwoAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'Active' } });
    expect(exactTwoAdmins).toBe(2);

    // 2. CONCURRENT RACE:
    // Admin A requests deletion of Admin B simultaneously as Admin B requests deletion of Admin A
    const reqDeleteB = request(app)
      .delete(`/api/users/${adminB.id}`)
      .set('Cookie', [cookieA]);

    const reqDeleteA = request(app)
      .delete(`/api/users/${adminA.id}`)
      .set('Cookie', [cookieB]);

    const [resDeleteB, resDeleteA] = await Promise.all([reqDeleteB, reqDeleteA]);

    const statuses = [resDeleteB.status, resDeleteA.status];
    // Exactly one must succeed (200), and the other must be safely rejected (400 LAST_ADMIN or 401 session revoked)
    expect(statuses).toContain(200);
    expect(statuses.some(s => s === 400 || s === 401)).toBe(true);

    const failedRes = resDeleteB.status !== 200 ? resDeleteB : resDeleteA;
    if (failedRes.status === 400) {
      expect(failedRes.body.error.code).toBe('LAST_ADMIN');
    } else {
      expect(failedRes.status).toBe(401);
    }

    // 3. CRITICAL INVARIANT: System MUST have exactly 1 active admin remaining, NEVER 0!
    const finalActiveAdminCount = await prisma.user.count({
      where: { role: 'ADMIN', status: 'Active' },
    });
    expect(finalActiveAdminCount).toBe(1);
  });
});
