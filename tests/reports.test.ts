import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin } from './setup';

describe('Reports & SQL Aggregations', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('calculates summary KPI metrics accurately via SQL', async () => {
    const { cookie } = await loginAsAdmin();

    const res = await request(app)
      .get('/api/reports/summary')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalProducts).toBe(8);
    expect(res.body.data.categoriesCount).toBe(4);
    expect(res.body.data.suppliersCount).toBe(3);
    expect(res.body.data.totalStockUnits).toBe(4 + 23 + 0 + 15 + 8 + 35 + 3 + 12); // = 100
    expect(res.body.data.outOfStockCount).toBe(1); // p3 (0)
    expect(res.body.data.lowStockCount).toBe(3); // p1 (4<=10), p5 (8<=10), p7 (3<=8)
    expect(res.body.data.inStockCount).toBe(4); // p2 (23>5), p4 (15>5), p6 (35>15), p8 (12>5)
  });

  it('retrieves low-stock items correctly sorted', async () => {
    const { cookie } = await loginAsAdmin();

    const res = await request(app)
      .get('/api/reports/low-stock')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Includes p3 (0), p7 (3), p1 (4), p5 (8)
    const skus = res.body.data.map((p: any) => p.sku);
    expect(skus).toContain('UC-003');
    expect(skus).toContain('OH-007');
    expect(skus).toContain('WM-001');
    expect(skus).toContain('WC-005');
  });

  it('aggregates stock valuation grouped by category', async () => {
    const { cookie } = await loginAsAdmin();

    const res = await request(app)
      .get('/api/reports/valuation')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(4);
    for (const cat of res.body.data) {
      expect(cat.totalValue).toBeGreaterThanOrEqual(0);
      expect(cat.itemCount).toBeGreaterThanOrEqual(0);
    }
  });
});
