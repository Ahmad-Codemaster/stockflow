/**
 * ============================================================================
 * VERIFICATION SUITE — Milestone 3
 * ============================================================================
 * What this test suite verifies:
 * 1. Idempotency: Duplicate requests with same Idempotency-Key return cached response
 *    and NEVER execute duplicate inventory mutations.
 * 2. Stock Adjustment: Supports target quantity count reconciliations and deltas,
 *    records 'ADJUSTMENT' ledger records and atomic audit logs.
 * 3. Atomic Rollback: Invariant violation aborts transaction with zero database mutations.
 * 4. Zod Middleware: Schema validation enforces required fields and types.
 */

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin, loginAsStaff } from './setup';

describe('Milestone 3 Verification: Idempotency, Adjustment & Atomic Rollback', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  describe('Idempotency Guard', () => {
    it('replays identical response for duplicate Idempotency-Key without duplicate stock deduction', async () => {
      const { cookie } = await loginAsStaff();

      // Product p2 starts with 23 units
      const idempotencyKey = 'idem-key-test-001';

      // First request
      const firstRes = await request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .set('Idempotency-Key', idempotencyKey)
        .send({
          productId: 'p2',
          quantity: 5,
          reference: 'SO-IDEM-001',
        });

      expect(firstRes.status).toBe(200);
      expect(firstRes.body.success).toBe(true);
      expect(firstRes.body.data.previousStock).toBe(23);
      expect(firstRes.body.data.newStock).toBe(18);

      // Verify DB shows 18
      const dbProductAfterFirst = await prisma.product.findUnique({ where: { id: 'p2' } });
      expect(dbProductAfterFirst?.quantity).toBe(18);

      // Second request with SAME idempotency key (simulating retry after network timeout)
      const secondRes = await request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .set('Idempotency-Key', idempotencyKey)
        .send({
          productId: 'p2',
          quantity: 5,
          reference: 'SO-IDEM-001',
        });

      // Must return identical cached response with replay header
      expect(secondRes.status).toBe(200);
      expect(secondRes.headers['x-idempotent-replay']).toBe('true');
      expect(secondRes.body.data.newStock).toBe(18);

      // CRITICAL CHECK: Product stock MUST still be 18 (NOT 13!)
      const dbProductAfterSecond = await prisma.product.findUnique({ where: { id: 'p2' } });
      expect(dbProductAfterSecond?.quantity).toBe(18);

      // CRITICAL CHECK: Only ONE transaction record must exist for this reference
      const txns = await prisma.stockTransaction.findMany({
        where: { reference: 'SO-IDEM-001' },
      });
      expect(txns.length).toBe(1);
    });
  });

  describe('Stock Adjustment Workflow', () => {
    it('adjusts stock to target physical count and records ADJUSTMENT ledger', async () => {
      const { cookie } = await loginAsStaff();

      // Product p1 has initial quantity 4
      const res = await request(app)
        .post('/api/inventory/adjust')
        .set('Cookie', [cookie])
        .send({
          productId: 'p1',
          targetQuantity: 12,
          reference: 'AUDIT-COUNT-2026',
          notes: 'Annual warehouse physical count adjustment',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.previousStock).toBe(4);
      expect(res.body.data.newStock).toBe(12);
      expect(res.body.data.delta).toBe(8);

      // Verify product in database
      const dbProduct = await prisma.product.findUnique({ where: { id: 'p1' } });
      expect(dbProduct?.quantity).toBe(12);

      // Verify immutable ADJUSTMENT ledger entry
      const txn = await prisma.stockTransaction.findUnique({
        where: { id: res.body.data.transactionId },
      });
      expect(txn?.type).toBe('ADJUSTMENT');
      expect(txn?.quantity).toBe(8);
      expect(txn?.newStock).toBe(12);

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: { action: 'STOCK_ADJUSTMENT', entityId: 'p1' },
      });
      expect(audit).toBeDefined();
    });

    it('rejects adjustment that would result in negative stock', async () => {
      const { cookie } = await loginAsStaff();

      // Product p1 has 4 units; delta of -10 would result in -6
      const res = await request(app)
        .post('/api/inventory/adjust')
        .set('Cookie', [cookie])
        .send({
          productId: 'p1',
          quantity: -10,
          notes: 'Excessive shrinkage',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

      // Database quantity must remain unchanged
      const dbProduct = await prisma.product.findUnique({ where: { id: 'p1' } });
      expect(dbProduct?.quantity).toBe(4);
    });
  });

  describe('Transactional Rollback Invariant', () => {
    it('rolls back completely when an over-deduction occurs with zero ledger mutation', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({
          productId: 'p1',
          quantity: 9999, // Exceeds available stock
          reference: 'FAIL-OVERFLOW',
        });

      expect(res.status).toBe(400);

      // Invariant: zero transactions created
      const txns = await prisma.stockTransaction.findMany({
        where: { reference: 'FAIL-OVERFLOW' },
      });
      expect(txns.length).toBe(0);

      // Invariant: product stock unchanged
      const product = await prisma.product.findUnique({ where: { id: 'p1' } });
      expect(product?.quantity).toBe(4);
    });
  });

  describe('Zod Validation Middleware', () => {
    it('rejects missing or negative quantity at schema level', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .post('/api/inventory/stock-in')
        .set('Cookie', [cookie])
        .send({
          productId: 'p1',
          quantity: -5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });
  });
});
