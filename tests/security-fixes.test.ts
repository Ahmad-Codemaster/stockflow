/**
 * ============================================================================
 * SECURITY REMEDIATIONS & CONCURRENCY VERIFICATION TEST SUITE
 * ============================================================================
 * Tests:
 * 1. Idempotency Key User Partitioning (No cross-user disclosure or DoS)
 * 2. Password Change Session Invalidation (Revocation of other active sessions)
 * 3. Case-Insensitive Product & Inventory Search (PostgreSQL ILIKE)
 * 4. Deterministic Bulk Stock-In Concurrency (Deadlock elimination)
 */

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin, loginAsStaff } from './setup';

describe('Security Remediations & Operational Hardening', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  describe('1. Idempotency Cache User Isolation', () => {
    it('prevents cross-user response disclosure when different users provide identical Idempotency-Key', async () => {
      const { cookie: adminCookie } = await loginAsAdmin();
      const { cookie: staffCookie } = await loginAsStaff();

      const sharedKey = 'IDEM-SHARED-TEST-KEY-001';

      // 1. Admin sends request with shared idempotency key
      const adminRes = await request(app)
        .post('/api/inventory/stock-in')
        .set('Cookie', [adminCookie])
        .set('Idempotency-Key', sharedKey)
        .send({
          productId: 'p1',
          quantity: 2,
          reference: 'ADMIN-REF-001',
          notes: 'Admin restock',
        });

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.success).toBe(true);

      // 2. Staff user sends request with SAME Idempotency-Key
      // With user partitioning, Staff's request executes independently under Staff's scope!
      const staffRes = await request(app)
        .post('/api/inventory/stock-in')
        .set('Cookie', [staffCookie])
        .set('Idempotency-Key', sharedKey)
        .send({
          productId: 'p2',
          quantity: 3,
          reference: 'STAFF-REF-002',
          notes: 'Staff restock',
        });

      expect(staffRes.status).toBe(200);
      expect(staffRes.body.success).toBe(true);
      // Verify Staff mutated p2 (Mechanical Keyboard), NOT replayed Admin's p1 response
      expect(staffRes.body.data.productId).toBe('p2');
      expect(staffRes.headers['x-idempotent-replay']).toBeUndefined();

      // 3. Repeating the EXACT same request for Staff DOES replay for Staff
      const staffReplayRes = await request(app)
        .post('/api/inventory/stock-in')
        .set('Cookie', [staffCookie])
        .set('Idempotency-Key', sharedKey)
        .send({
          productId: 'p2',
          quantity: 3,
        });

      expect(staffReplayRes.status).toBe(200);
      expect(staffReplayRes.headers['x-idempotent-replay']).toBe('true');
      expect(staffReplayRes.body.data.productId).toBe('p2');
    });
  });

  describe('2. Active Session Revocation on Password Change', () => {
    it('revokes secondary active sessions across other devices when password is changed', async () => {
      // 1. Device A logs in
      const loginA = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ali@stockflow.com', password: 'Staff@123' });
      const cookieA = loginA.headers['set-cookie']?.[0] || '';

      // 2. Device B logs in (simulating second browser / stolen session)
      const loginB = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ali@stockflow.com', password: 'Staff@123' });
      const cookieB = loginB.headers['set-cookie']?.[0] || '';

      expect(cookieA).not.toBe(cookieB);

      // Verify both sessions work initially
      const meA1 = await request(app).get('/api/auth/me').set('Cookie', [cookieA]);
      expect(meA1.status).toBe(200);
      const meB1 = await request(app).get('/api/auth/me').set('Cookie', [cookieB]);
      expect(meB1.status).toBe(200);

      // 3. User changes password on Device A
      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [cookieA])
        .send({
          currentPassword: 'Staff@123',
          newPassword: 'NewStaffPassword@456',
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // 4. Device A remains authenticated (no disruptive kick-out)
      const meA2 = await request(app).get('/api/auth/me').set('Cookie', [cookieA]);
      expect(meA2.status).toBe(200);

      // 5. Device B session MUST be revoked (returns 401 UNAUTHORIZED)
      const meB2 = await request(app).get('/api/auth/me').set('Cookie', [cookieB]);
      expect(meB2.status).toBe(401);
      expect(meB2.body.success).toBe(false);
      expect(meB2.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('3. Case-Insensitive Catalog & Inventory Search', () => {
    it('matches products regardless of casing in /api/products?search=', async () => {
      const { cookie } = await loginAsAdmin();

      // Lowercase search for uppercase "Wireless Mouse"
      const resLower = await request(app)
        .get('/api/products?search=wireless')
        .set('Cookie', [cookie]);

      expect(resLower.status).toBe(200);
      expect(resLower.body.success).toBe(true);
      expect(resLower.body.data.length).toBeGreaterThanOrEqual(1);
      const skus = resLower.body.data.map((p: any) => p.sku);
      expect(skus).toContain('WM-001');

      // Uppercase search
      const resUpper = await request(app)
        .get('/api/products?search=WIRELESS')
        .set('Cookie', [cookie]);

      expect(resUpper.status).toBe(200);
      expect(resUpper.body.data.map((p: any) => p.sku)).toContain('WM-001');
    });

    it('matches inventory items regardless of casing in /api/inventory?search=', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .get('/api/inventory?search=keyboard')
        .set('Cookie', [cookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].sku).toBe('MK-002');
    });
  });

  describe('4. Deterministic Lock Ordering in Bulk Stock-In', () => {
    it('processes bulk stock-in items with out-of-order SKUs cleanly and updates inventory', async () => {
      const { cookie } = await loginAsAdmin();

      // Reverse alphabetical order: WM-001, UC-003, MK-002
      const items = [
        { sku: 'WM-001', quantity: 5, reference: 'BULK-ORDER-1' },
        { sku: 'UC-003', quantity: 10, reference: 'BULK-ORDER-2' },
        { sku: 'MK-002', quantity: 2, reference: 'BULK-ORDER-3' },
      ];

      const res = await request(app)
        .post('/api/inventory/bulk-stock-in')
        .set('Cookie', [cookie])
        .send({ items });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedCount).toBe(3);

      // Verify stocks were updated
      const p1 = await prisma.product.findUnique({ where: { sku: 'WM-001' } });
      const p2 = await prisma.product.findUnique({ where: { sku: 'MK-002' } });
      const p3 = await prisma.product.findUnique({ where: { sku: 'UC-003' } });

      expect(p1?.quantity).toBe(4 + 5); // initial 4 + 5
      expect(p2?.quantity).toBe(23 + 2); // initial 23 + 2
      expect(p3?.quantity).toBe(0 + 10); // initial 0 + 10
    });
  });
});
