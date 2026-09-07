/**
 * ============================================================================
 * CONCURRENCY & RACE CONDITION AUTOMATED TEST
 * ============================================================================
 * What this test proves:
 * - When multiple users submit Stock-Out requests simultaneously for the same item,
 *   the system does NOT allow race conditions (Lost Updates) or negative inventory.
 * 
 * Test Setup & Mechanics:
 * - Product `p4` is initialized with exactly 10 units in stock.
 * - 10 parallel HTTP requests are generated, each asking to withdraw 2 units (20 total units requested).
 * - `Promise.all(requests)` fires all 10 requests at the exact same millisecond against Express.
 * 
 * Expected Invariant Outcomes:
 * 1. Exactly 5 requests succeed (HTTP 200) -> 10 units deducted.
 * 2. Exactly 5 requests fail (HTTP 400) with error code `INSUFFICIENT_STOCK`.
 * 3. Final database quantity in PostgreSQL is verified to be EXACTLY 0 (never negative).
 * 4. Exactly 5 immutable stock transaction ledger rows are created in the database.
 */

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsStaff } from './setup';

describe('Concurrency Control & Race Condition Prevention', () => {
  // Re-seed database before test to ensure clean baseline state
  beforeEach(async () => {
    await seedDatabase();
  });

  it('prevents race conditions and negative inventory under 10 concurrent Stock-Out requests', async () => {
    // 1. Authenticate as a staff warehouse operator
    const { cookie } = await loginAsStaff();

    // 2. Set product p4 to exactly 10 units in stock
    await prisma.product.update({
      where: { id: 'p4' },
      data: { quantity: 10 },
    });

    // 3. Build 10 concurrent requests (each requesting 2 units -> 20 units total)
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

    // 4. Fire all 10 requests simultaneously using Promise.all
    const responses = await Promise.all(requests);

    // 5. Partition responses into successful and failed buckets
    const successful = responses.filter(r => r.status === 200);
    const failed = responses.filter(r => r.status === 400);

    // Verify exactly 5 requests succeeded and 5 failed
    expect(successful.length).toBe(5);
    expect(failed.length).toBe(5);

    // Verify failed requests returned the standardized INSUFFICIENT_STOCK error code
    for (const failRes of failed) {
      expect(failRes.body.error.code).toBe('INSUFFICIENT_STOCK');
    }

    // 6. INVARIANT CHECK: Final database stock must be EXACTLY 0, never negative
    const finalProduct = await prisma.product.findUnique({ where: { id: 'p4' } });
    expect(finalProduct?.quantity).toBe(0);

    // 7. LEDGER CHECK: Verify exactly 5 transaction rows were inserted into stock_transactions
    const txns = await prisma.stockTransaction.findMany({
      where: { reference: { startsWith: 'RACE-TEST-' } },
    });
    expect(txns.length).toBe(5);
  });
});
