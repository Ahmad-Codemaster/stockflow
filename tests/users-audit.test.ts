import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin } from './setup';

describe('User Management & Audit Logging', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('Admin creates a new Staff user with normalized lowercase email', async () => {
    const { cookie } = await loginAsAdmin();

    const res = await request(app)
      .post('/api/users')
      .set('Cookie', [cookie])
      .send({
        name: 'Zayn Malik',
        email: 'ZAYN@STOCKFLOW.COM',
        role: 'STAFF',
        status: 'Active',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('zayn@stockflow.com');
    expect(res.body.data.role).toBe('STAFF');

    // Verify audit log
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'USER_CREATE', entityId: res.body.data.id },
    });
    expect(audit).toBeDefined();
    expect(audit?.userId).toBe('u1');
  });

  it('deactivating a user immediately purges their active sessions from the database', async () => {
    // 1. Staff logs in to get an active session
    const staffLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ali@stockflow.com', password: 'Staff@123' });

    const staffCookie = staffLoginRes.headers['set-cookie'][0];
    const staffSessionId = staffLoginRes.body.data.sessionId;

    // Verify session exists
    const sessionBefore = await prisma.session.findUnique({ where: { id: staffSessionId } });
    expect(sessionBefore).toBeDefined();

    // 2. Admin deactivates staff account
    const { cookie: adminCookie } = await loginAsAdmin();

    const deactivateRes = await request(app)
      .patch('/api/users/u2/deactivate')
      .set('Cookie', [adminCookie]);

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.status).toBe('Inactive');

    // 3. Verify session was immediately purged from DB
    const sessionAfter = await prisma.session.findUnique({ where: { id: staffSessionId } });
    expect(sessionAfter).toBeNull();

    // 4. Staff attempts to make a request with their previous session -> rejected with 401
    const reqRes = await request(app)
      .get('/api/inventory')
      .set('Cookie', [staffCookie]);

    expect(reqRes.status).toBe(401);

    // 5. Staff attempts to log in again -> rejected with 403 ACCOUNT_INACTIVE
    const reLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ali@stockflow.com', password: 'Staff@123' });

    expect(reLoginRes.status).toBe(403);
    expect(reLoginRes.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('records audit logs for all critical administrative and mutation operations', async () => {
    const { cookie } = await loginAsAdmin();

    const res = await request(app)
      .get('/api/users/audit-logs')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Admin permanently deletes a user account and purges sessions', async () => {
    const { cookie } = await loginAsAdmin();

    // 1. Delete user u3 (Sara Ahmed)
    const deleteRes = await request(app)
      .delete('/api/users/u3')
      .set('Cookie', [cookie]);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // 2. Verify user no longer exists in DB
    const dbUser = await prisma.user.findUnique({ where: { id: 'u3' } });
    expect(dbUser).toBeNull();

    // 3. Verify audit log was recorded
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'USER_DELETE', entityId: 'u3' },
    });
    expect(audit).toBeDefined();
  });

  it('prevents Admin from deleting their own active administrator account', async () => {
    const { cookie, user } = await loginAsAdmin();

    const deleteRes = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Cookie', [cookie]);

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.error.code).toBe('SELF_DELETION_FORBIDDEN');
  });
});
