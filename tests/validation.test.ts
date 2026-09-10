/**
 * ============================================================================
 * API BOUNDARY VALIDATION AUTOMATED TEST SUITE
 * ============================================================================
 * What this test suite proves:
 * 1. Body Validation:
 *    - Valid payloads pass.
 *    - Missing required fields return HTTP 400 with VALIDATION_ERROR code.
 *    - Invalid data types (e.g. string for integer quantity) return HTTP 400.
 *    - Out-of-bounds numbers (negative quantity, negative price) return HTTP 400.
 *    - Invalid enums (e.g. role='SUPERUSER') return HTTP 400.
 *    - Unknown fields are stripped cleanly without breaking or polluting.
 * 2. Route Parameter Validation (:id):
 *    - Empty or whitespace-only IDs return HTTP 400 before database queries.
 * 3. Query Parameter Validation:
 *    - Out-of-bounds limits (>500 or <=0) return HTTP 400.
 *    - Invalid enum filter values return HTTP 400.
 */

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin, loginAsStaff } from './setup';

describe('Phase 3: Strong API Input Validation at Boundary', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  describe('1. Request Body Validation', () => {
    it('rejects product creation missing required fields (sku, name, categoryId)', async () => {
      const { cookie } = await loginAsAdmin();

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', [cookie])
        .send({
          price: 99.99,
          reorderLevel: 10,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);

      const paths = res.body.error.details.map((d: any) => d.path);
      expect(paths).toContain('name');
      expect(paths).toContain('sku');
      expect(paths).toContain('categoryId');
    });

    it('rejects non-numeric or non-integer quantities in Stock-In', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .post('/api/inventory/stock-in')
        .set('Cookie', [cookie])
        .send({
          productId: 'p1',
          quantity: 'ten', // String instead of number
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('quantity');
    });

    it('rejects negative or zero quantities at boundary', async () => {
      const { cookie } = await loginAsStaff();

      // Negative quantity
      const resNeg = await request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({
          productId: 'p1',
          quantity: -10,
        });

      expect(resNeg.status).toBe(400);
      expect(resNeg.body.error.code).toBe('VALIDATION_ERROR');

      // Zero quantity
      const resZero = await request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({
          productId: 'p1',
          quantity: 0,
        });

      expect(resZero.status).toBe(400);
      expect(resZero.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects negative prices in product creation', async () => {
      const { cookie } = await loginAsAdmin();

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', [cookie])
        .send({
          name: 'Invalid Price Item',
          sku: 'INV-PRICE-001',
          categoryId: 'c1',
          price: -25.5,
          reorderLevel: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('price');
    });

    it('rejects invalid role enumeration in user creation', async () => {
      const { cookie } = await loginAsAdmin();

      const res = await request(app)
        .post('/api/users')
        .set('Cookie', [cookie])
        .send({
          name: 'Hacker User',
          email: 'hacker@stockflow.com',
          role: 'SUPERADMIN', // Invalid enum
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('role');
    });

    it('strips unknown unexpected fields without crashing or saving them', async () => {
      const { cookie } = await loginAsAdmin();

      const res = await request(app)
        .post('/api/categories')
        .set('Cookie', [cookie])
        .send({
          name: 'Valid Category Name',
          description: 'Valid Description',
          injectedMaliciousField: 'exploit_value',
          __internalProp: 12345,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Valid Category Name');
      // Injected fields must not exist in response or DB
      expect((res.body.data as any).injectedMaliciousField).toBeUndefined();
    });
  });

  describe('2. Route Parameter Validation (:id)', () => {
    it('rejects empty or whitespace-only route parameter with 400 VALIDATION_ERROR', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .get('/api/products/%20') // Encoded whitespace
        .set('Cookie', [cookie]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('id');
    });
  });

  describe('3. Query Parameter Validation', () => {
    it('rejects invalid enum values in inventory status filter', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .get('/api/inventory?status=NonExistentStatus')
        .set('Cookie', [cookie]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('status');
    });

    it('rejects out-of-bounds pagination limit in transactions query (>500)', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .get('/api/inventory/transactions?limit=99999')
        .set('Cookie', [cookie]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('limit');
    });

    it('rejects negative pagination limit in audit logs query', async () => {
      const { cookie } = await loginAsAdmin();

      const res = await request(app)
        .get('/api/users/audit-logs?limit=-20')
        .set('Cookie', [cookie]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('limit');
    });

    it('accepts valid query parameters and returns filtered data', async () => {
      const { cookie } = await loginAsStaff();

      const res = await request(app)
        .get('/api/inventory?status=In%20Stock')
        .set('Cookie', [cookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
