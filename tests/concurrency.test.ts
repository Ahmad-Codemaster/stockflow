import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsStaff } from './setup';

describe('Concurrency Control & Race Condition Prevention', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('prevents race conditions and negative inventory under 10 concurrent Stock-Out requests', async () => {
    const { cookie } = await loginAsStaff();

    // Reset product p4 to exactly 10 units in stock
    await prisma.product.update({
      where: { id: 'p4' },
      data: { quantity: 10 },
    });

    // 10 concurrent requests each attempting to withdraw 2 units (Total requested = 20 units)
    // Only 5 requests should succeed (10 units deducted), remaining 5 must fail with 400 Insufficient Stock
    const requests = Array.from({ length: 10 }).map((_, idx) =>
      request(app)
        .post('/api/inventory/stock-out')
        .set('Cookie', [cookie])
        .send({
          productId: 'p4',
          quantity: 2,
          reference: `RACE-TEST-${idx}`,
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

    // Final database stock must be EXACTLY 0, never negative
    const finalProduct = await prisma.product.findUnique({ where: { id: 'p4' } });
    expect(finalProduct?.quantity).toBe(0);

    // Verify exactly 5 transaction rows created
    const txns = await prisma.stockTransaction.findMany({
      where: { reference: { startsWith: 'RACE-TEST-' } },
    });
    expect(txns.length).toBe(5);
  });
});
