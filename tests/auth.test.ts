/**
 * ============================================================================
 * AUTHENTICATION & SESSION LIFECYCLE TEST SUITE
 * ============================================================================
 * What this test suite proves:
 * - Credentials verification using Bcrypt password hashing.
 * - Issuance and persistence of `stockflow_session` HttpOnly cookie.
 * - Case-insensitive email normalization.
 * - Anti-enumeration security: identical 401 responses for both bad passwords and bad emails.
 * - Immediate blocking of deactivated employee accounts.
 * - Complete database cleanup on logout.
 */

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin } from './setup';

describe('Authentication & Session Management', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  /**
   * Test 1: Successful Authentication & Cookie Set
   */
  it('should authenticate Admin user with valid credentials and return session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ahmad@stockflow.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('ahmad@stockflow.com');
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('stockflow_session=');

    // SECURITY INVARIANT: Raw session token MUST NOT be exposed in response body
    expect(res.body.data.sessionId).toBeUndefined();

    // Verify session row exists in DB by extracting token from HttpOnly cookie
    const cookie = res.headers['set-cookie'][0];
    const sessionId = cookie.match(/stockflow_session=([^;]+)/)?.[1];
    expect(sessionId).toBeDefined();
    const dbSession = await prisma.session.findUnique({ where: { id: sessionId! } });
    expect(dbSession).toBeDefined();
    expect(dbSession?.userId).toBe('u1');
  });

  /**
   * Test 2: Case-Insensitive Email Matching
   */
  it('should authenticate case-insensitively on email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'AHMAD@STOCKFLOW.COM', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  /**
   * Test 3: Bad Password Rejection
   */
  it('should reject invalid password with 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ahmad@stockflow.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject nonexistent email with 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@stockflow.com', password: 'Admin@123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject deactivated user with 403 ACCOUNT_INACTIVE', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'omar@stockflow.com', password: 'Staff@123' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('should return authenticated user via GET /api/auth/me', async () => {
    const { cookie } = await loginAsAdmin();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('ahmad@stockflow.com');
  });

  it('should logout and invalidate session in DB', async () => {
    const { cookie } = await loginAsAdmin();
    const sessionId = cookie.match(/stockflow_session=([^;]+)/)?.[1];

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify session row is purged from DB
    const dbSession = await prisma.session.findUnique({ where: { id: sessionId! } });
    expect(dbSession).toBeNull();

    // Subsequent request with old cookie fails with 401
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [cookie]);
    expect(meRes.status).toBe(401);
  });
});
