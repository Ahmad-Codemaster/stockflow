/**
 * ============================================================================
 * BULK CSV IMPORT & INVENTORY BATCH TEST SUITE (`tests/bulk-import.test.ts`)
 * ============================================================================
 * What this test suite verifies:
 * 1. Admin-Exclusive Privilege:
 *    - Staff users are strictly BLOCKED with HTTP 403 Forbidden on:
 *      • POST /api/products/bulk
 *      • POST /api/inventory/bulk-stock-in
 *      • POST /api/inventory/bulk-stock-out
 *    - Admin users have full authority to process bulk batches.
 * 2. User Attribution:
 *    - Created products and stock movements are attributed to the active admin user's ID.
 * 3. Option A (Strict All-or-Nothing Atomic Rollback):
 *    - If any row in a bulk stock-out batch exceeds available inventory, the entire
 *      transaction rolls back with zero modifications to any product's stock.
 * 4. Data Validation:
 *    - Duplicate SKUs within a batch are rejected with HTTP 400.
 *    - Conflicting SKUs already in catalog are rejected with HTTP 409.
 */

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin, loginAsStaff } from './setup';

describe('Bulk CSV Import & Operations (Admin-Exclusive & Option A)', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  /**
   * 1. RBAC: Strict Admin Exclusivity
   */
  describe('RBAC Authorization Guards', () => {
    it('Staff is rejected with 403 Forbidden on POST /api/products/bulk', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .post('/api/products/bulk')
        .set('Cookie', [cookie])
        .send({
          items: [
            {
              name: 'Staff Unauthorized Item',
              sku: 'STAFF-FAIL-01',
              categoryName: 'General',
              price: 25.0,
              initialStock: 5,
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Staff is rejected with 403 Forbidden on POST /api/inventory/bulk-stock-in', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .post('/api/inventory/bulk-stock-in')
        .set('Cookie', [cookie])
        .send({
          items: [
            {
              sku: 'WM-001',
              quantity: 10,
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Staff is rejected with 403 Forbidden on POST /api/inventory/bulk-stock-out', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .post('/api/inventory/bulk-stock-out')
        .set('Cookie', [cookie])
        .send({
          items: [
            {
              sku: 'WM-001',
              quantity: 2,
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  /**
   * 2. Bulk Product Creation
   */
  describe('Bulk Product Import', () => {
    it('Admin can successfully import a batch of products with user attribution', async () => {
      const { cookie, user } = await loginAsAdmin();

      const res = await request(app)
        .post('/api/products/bulk')
        .set('Cookie', [cookie])
        .send({
          items: [
            {
              name: 'Bulk Wireless Headphones',
              sku: 'BULK-HP-01',
              categoryName: 'Audio & Acoustics',
              price: 199.99,
              initialStock: 25,
              reorderLevel: 8,
              description: 'Imported via CSV',
            },
            {
              name: 'Bulk USB-C Hub 7-in-1',
              sku: 'BULK-HUB-02',
              categoryName: 'Accessories',
              price: 49.99,
              initialStock: 0,
              reorderLevel: 10,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.createdCount).toBe(2);

      // Verify products are in database
      const p1 = await prisma.product.findUnique({
        where: { sku: 'BULK-HP-01' },
      });
      expect(p1).toBeDefined();
      expect(p1?.quantity).toBe(25);

      // Verify initial stock transaction is attributed to admin user
      const initialTxn = await prisma.stockTransaction.findFirst({
        where: { productId: p1!.id, type: 'STOCK_IN' },
      });
      expect(initialTxn).toBeDefined();
      expect(initialTxn?.performedById).toBe(user.id);
      expect(initialTxn?.quantity).toBe(25);
    });

    it('Rejects batch with duplicate SKUs inside the CSV payload', async () => {
      const { cookie } = await loginAsAdmin();

      const res = await request(app)
        .post('/api/products/bulk')
        .set('Cookie', [cookie])
        .send({
          items: [
            {
              name: 'Item A',
              sku: 'DUP-SKU-99',
              categoryName: 'Electronics',
              price: 10,
            },
            {
              name: 'Item B',
              sku: 'DUP-SKU-99',
              categoryName: 'Electronics',
              price: 20,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DUPLICATE_SKU');
    });

    it('Rejects batch if SKU already exists in catalog (Conflict 409)', async () => {
      const { cookie, user } = await loginAsAdmin();

      const res = await request(app)
        .post('/api/products/bulk')
        .set('Cookie', [cookie])
        .send({
          items: [
            {
              name: 'Duplicate of Existing',
              sku: 'WM-001', // already exists in seed (Wireless Mouse)
              categoryName: 'Peripherals',
              price: 99,
            },
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_SKU');
    });
  });

  /**
   * 3. Bulk Stock-In Workflow
   */
  describe('Bulk Stock-In Replenishment', () => {
    it('Admin can bulk stock-in multiple SKUs atomically with ledger attribution', async () => {
      const { cookie, user } = await loginAsAdmin();

      const beforeP1 = await prisma.product.findUnique({ where: { sku: 'WM-001' } });
      const beforeP2 = await prisma.product.findUnique({ where: { sku: 'MK-002' } });

      const res = await request(app)
        .post('/api/inventory/bulk-stock-in')
        .set('Cookie', [cookie])
        .send({
          items: [
            { sku: 'WM-001', quantity: 15, reference: 'PO-BULK-001' },
            { sku: 'MK-002', quantity: 30, reference: 'PO-BULK-001' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedCount).toBe(2);

      const afterP1 = await prisma.product.findUnique({ where: { sku: 'WM-001' } });
      const afterP2 = await prisma.product.findUnique({ where: { sku: 'MK-002' } });

      expect(afterP1!.quantity).toBe(beforeP1!.quantity + 15);
      expect(afterP2!.quantity).toBe(beforeP2!.quantity + 30);

      // Verify transaction ledger rows
      const txns = await prisma.stockTransaction.findMany({
        where: { reference: 'PO-BULK-001' },
      });
      expect(txns.length).toBe(2);
      expect(txns[0].performedById).toBe(user.id);
    });
  });

  /**
   * 4. Bulk Stock-Out Workflow & Option A (Strict All-or-Nothing)
   */
  describe('Bulk Stock-Out & Option A Rollback', () => {
    it('Admin can bulk stock-out valid quantities with ledger records', async () => {
      const { cookie, user } = await loginAsAdmin();

      const beforeP1 = await prisma.product.findUnique({ where: { sku: 'WM-001' } });
      const beforeP2 = await prisma.product.findUnique({ where: { sku: 'MK-002' } });

      const res = await request(app)
        .post('/api/inventory/bulk-stock-out')
        .set('Cookie', [cookie])
        .send({
          items: [
            { sku: 'WM-001', quantity: 2, reference: 'DISPATCH-01' },
            { sku: 'MK-002', quantity: 3, reference: 'DISPATCH-01' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedCount).toBe(2);

      const afterP1 = await prisma.product.findUnique({ where: { sku: 'WM-001' } });
      const afterP2 = await prisma.product.findUnique({ where: { sku: 'MK-002' } });

      expect(afterP1!.quantity).toBe(beforeP1!.quantity - 2);
      expect(afterP2!.quantity).toBe(beforeP2!.quantity - 3);

      const txns = await prisma.stockTransaction.findMany({
        where: { reference: 'DISPATCH-01' },
      });
      expect(txns.length).toBe(2);
      expect(txns[0].performedById).toBe(user.id);
      expect(txns[0].type).toBe('STOCK_OUT');
    });

    it('Strict Option A: Entire batch rolls back when any row has insufficient stock', async () => {
      const { cookie } = await loginAsAdmin();

      const beforeP1 = await prisma.product.findUnique({ where: { sku: 'WM-001' } });
      const beforeP2 = await prisma.product.findUnique({ where: { sku: 'MK-002' } });

      // Request 1 unit from WM-001 (valid), but 99999 units from MK-002 (insufficient)
      const res = await request(app)
        .post('/api/inventory/bulk-stock-out')
        .set('Cookie', [cookie])
        .send({
          items: [
            { sku: 'WM-001', quantity: 1, reference: 'FAIL-BATCH-99' },
            { sku: 'MK-002', quantity: 99999, reference: 'FAIL-BATCH-99' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

      // CRITICAL OPTION A INVARIANT: WM-001 must NOT have been deducted!
      const afterP1 = await prisma.product.findUnique({ where: { sku: 'WM-001' } });
      const afterP2 = await prisma.product.findUnique({ where: { sku: 'MK-002' } });

      expect(afterP1!.quantity).toBe(beforeP1!.quantity);
      expect(afterP2!.quantity).toBe(beforeP2!.quantity);

      // Verify zero transactions created
      const txns = await prisma.stockTransaction.findMany({
        where: { reference: 'FAIL-BATCH-99' },
      });
      expect(txns.length).toBe(0);
    });
  });
});
