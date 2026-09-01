import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin, loginAsStaff } from './setup';

describe('Additional Auth, Transactions & Reports Flows', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('allows authenticated user to change their password', async () => {
    const { cookie } = await loginAsAdmin();

    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', [cookie])
      .send({
        currentPassword: 'Admin@123',
        newPassword: 'NewAdminPassword@123',
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.success).toBe(true);

    // Verify login with new password succeeds
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ahmad@stockflow.com',
        password: 'NewAdminPassword@123',
      });
    expect(newLoginRes.status).toBe(200);
  });

  it('rejects password change with incorrect current password', async () => {
    const { cookie } = await loginAsAdmin();

    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', [cookie])
      .send({
        currentPassword: 'WrongCurrentPassword',
        newPassword: 'NewAdminPassword@123',
      });

    expect(changeRes.status).toBe(400);
    expect(changeRes.body.error.code).toBe('INVALID_PASSWORD');
  });

  it('fetches single transaction details and ledger with filters', async () => {
    const { cookie } = await loginAsStaff();

    // 1. Fetch single transaction t1
    const singleRes = await request(app)
      .get('/api/inventory/transactions/t1')
      .set('Cookie', [cookie]);

    expect(singleRes.status).toBe(200);
    expect(singleRes.body.data.id).toBe('t1');
    expect(singleRes.body.data.productName).toBe('Mechanical Keyboard');

    // 2. Fetch ledger with type filter
    const ledgerRes = await request(app)
      .get('/api/inventory/transactions?type=stock_in')
      .set('Cookie', [cookie]);

    expect(ledgerRes.status).toBe(200);
    expect(Array.isArray(ledgerRes.body.data)).toBe(true);
    for (const t of ledgerRes.body.data) {
      expect(t.rawType).toBe('STOCK_IN');
    }
  });

  it('retrieves movement report metrics', async () => {
    const { cookie } = await loginAsStaff();

    const res = await request(app)
      .get('/api/reports/movement')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIn).toBeGreaterThan(0);
    expect(res.body.data.totalOut).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.recentMovements)).toBe(true);
  });
});
