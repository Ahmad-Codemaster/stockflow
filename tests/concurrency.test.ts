/**
 * ============================================================================
 * CONCURRENCY & INVENTORY INTEGRITY AUTOMATED TEST SUITE
 * ============================================================================
 * What this test suite proves:
 * 1. Scenario 1 (Competing Over-Allocation):
 *    Stock = 10, Request A = 8, Request B = 7
 *    -> Exactly one succeeds, one fails (400 INSUFFICIENT_STOCK), final stock is 2 or 3.
 * 2. Scenario 2 (Exact Exhaustion):
 *    Stock = 10, Request A = 5, Request B = 5
 *    -> Both succeed, final stock is 0.
 * 3. Scenario 3 (Equal Contention):
 *    Stock = 10, Request A = 8, Request B = 8
 *    -> Exactly one succeeds, final stock is 2.
 * 4. Scenario 4 (Transactional Rollback Invariant):
 *    Forced failure during stock-out ensures zero partial mutations to product, ledger, or audit logs.
 * 5. High-Concurrency Burst (10 Parallel Requests):
 *    10 parallel requests requesting 2 units each from 10 initial units
 *    -> Exactly 5 succeed, 5 fail, final stock is 0, exactly 5 ledger rows created.
 */

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsStaff } from './setup';

describe('Database-Level Concurrency Control & Inventory Integrity', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  describe('Scenario 1: Competing Over-Allocation (Stock = 10, Req A = 8, Req B = 7)', () => {
    it('serializes conflicting requests, succeeds one, rejects one, and prevents negative stock', async () => {
      const { cookie } = await loginAsStaff();

      await prisma.product.update({
        where: { id: 'p4' },
        data: { quantity: 10 },
      });

      const reqA = request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({ productId: 'p4', quantity: 8, reference: 'SCENARIO-1-A' });

      const reqB = request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({ productId: 'p4', quantity: 7, reference: 'SCENARIO-1-B' });

      const [resA, resB] = await Promise.all([reqA, reqB]);

      const successResponses = [resA, resB].filter(r => r.status === 200);
      const failedResponses = [resA, resB].filter(r => r.status === 400);

      expect(successResponses.length).toBe(1);
      expect(failedResponses.length).toBe(1);
      expect(failedResponses[0].body.error.code).toBe('INSUFFICIENT_STOCK');

      const product = await prisma.product.findUnique({ where: { id: 'p4' } });
      // If A won: 10 - 8 = 2; If B won: 10 - 7 = 3. In neither case can it be negative (-5).
      expect([2, 3]).toContain(product?.quantity);

      const txns = await prisma.stockTransaction.findMany({
        where: { reference: { in: ['SCENARIO-1-A', 'SCENARIO-1-B'] } },
      });
      expect(txns.length).toBe(1);
    });
  });

  describe('Scenario 2: Exact Stock Exhaustion (Stock = 10, Req A = 5, Req B = 5)', () => {
    it('allows both requests to succeed sequentially resulting in exactly 0 stock', async () => {
      const { cookie } = await loginAsStaff();

      await prisma.product.update({
        where: { id: 'p4' },
        data: { quantity: 10 },
      });

      const reqA = request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({ productId: 'p4', quantity: 5, reference: 'SCENARIO-2-A' });

      const reqB = request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({ productId: 'p4', quantity: 5, reference: 'SCENARIO-2-B' });

      const [resA, resB] = await Promise.all([reqA, reqB]);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);

      const product = await prisma.product.findUnique({ where: { id: 'p4' } });
      expect(product?.quantity).toBe(0);

      const txns = await prisma.stockTransaction.findMany({
        where: { reference: { in: ['SCENARIO-2-A', 'SCENARIO-2-B'] } },
      });
      expect(txns.length).toBe(2);
    });
  });

  describe('Scenario 3: Equal Contention (Stock = 10, Req A = 8, Req B = 8)', () => {
    it('allows only one request to win and leaves exactly 2 units remaining', async () => {
      const { cookie } = await loginAsStaff();

      await prisma.product.update({
        where: { id: 'p4' },
        data: { quantity: 10 },
      });

      const reqA = request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({ productId: 'p4', quantity: 8, reference: 'SCENARIO-3-A' });

      const reqB = request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({ productId: 'p4', quantity: 8, reference: 'SCENARIO-3-B' });

      const [resA, resB] = await Promise.all([reqA, reqB]);

      const successResponses = [resA, resB].filter(r => r.status === 200);
      const failedResponses = [resA, resB].filter(r => r.status === 400);

      expect(successResponses.length).toBe(1);
      expect(failedResponses.length).toBe(1);
      expect(failedResponses[0].body.error.code).toBe('INSUFFICIENT_STOCK');

      const product = await prisma.product.findUnique({ where: { id: 'p4' } });
      expect(product?.quantity).toBe(2);

      const txns = await prisma.stockTransaction.findMany({
        where: { reference: { in: ['SCENARIO-3-A', 'SCENARIO-3-B'] } },
      });
      expect(txns.length).toBe(1);
    });
  });

  describe('Scenario 4: Transactional Rollback Invariant', () => {
    it('ensures complete rollback with zero mutations across product, ledger, and audit log', async () => {
      const { cookie } = await loginAsStaff();

      // Product p4 has 10 units
      await prisma.product.update({
        where: { id: 'p4' },
        data: { quantity: 10 },
      });

      const initialAuditCount = await prisma.auditLog.count();
      const initialTxnCount = await prisma.stockTransaction.count();

      // Attempt over-deduction (request 50 units from 10 available)
      const res = await request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({
          productId: 'p4',
          quantity: 50,
          reference: 'FAIL-OVERDRAFT',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

      // 1. Product quantity must remain strictly unchanged (10)
      const product = await prisma.product.findUnique({ where: { id: 'p4' } });
      expect(product?.quantity).toBe(10);

      // 2. Zero stock transaction records created
      const finalTxnCount = await prisma.stockTransaction.count();
      expect(finalTxnCount).toBe(initialTxnCount);

      // 3. Zero audit log records created
      const finalAuditCount = await prisma.auditLog.count();
      expect(finalAuditCount).toBe(initialAuditCount);
    });
  });

  describe('Burst Concurrency: 10 Parallel Requests', () => {
    it('prevents race conditions and negative inventory under 10 concurrent Stock-Out requests', async () => {
      const { cookie } = await loginAsStaff();

      await prisma.product.update({
        where: { id: 'p4' },
        data: { quantity: 10 },
      });

      const requests = Array.from({ length: 10 }).map((_, idx) =>
        request(app)
          .post('/api/inventory/stock-out')
          .set('Cookie', [cookie])
          .send({
            productId: 'p4',
            quantity: 2,
            reference: `BURST-TEST-${idx}`,
          })
      );

      const responses = await Promise.all(requests);

      const successful = responses.filter(r => r.status === 200);
      const failed = responses.filter(r => r.status === 400);

      expect(successful.length).toBe(5);
      expect(failed.length).toBe(5);

      for (const failRes of failed) {
        expect(failRes.body.error.code).toBe('INSUFFICIENT_STOCK');
      }

      const finalProduct = await prisma.product.findUnique({ where: { id: 'p4' } });
      expect(finalProduct?.quantity).toBe(0);

      const txns = await prisma.stockTransaction.findMany({
        where: { reference: { startsWith: 'BURST-TEST-' } },
      });
      expect(txns.length).toBe(5);
    });
  });
});
