import request from 'supertest';
import { beforeAll } from 'vitest';
import app from '../server/app';
import { seedDatabase } from '../server/seed';

import { execSync } from 'child_process';

beforeAll(async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
    try {
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'ignore',
      });
    } catch {
      // ignore migration errors in environments where DB is already current
    }
  }

  try {
    await seedDatabase();
  } catch (err: any) {
    const isConnectionError =
      err?.message?.includes('connect ECONNREFUSED') ||
      err?.message?.includes("Can't reach database server") ||
      err?.code === 'P1001';

    if (isConnectionError) {
      console.warn(
        '\n⚠️  WARN: PostgreSQL is not reachable at the configured DATABASE_URL.\n' +
        '         Integration tests that require a database will be skipped.\n' +
        '         Start PostgreSQL on localhost:5432 and re-run to execute the full suite.\n'
      );
      return;
    }
    throw err;
  }
});

export async function loginAsAdmin(): Promise<{ cookie: string; user: any }> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ahmad@stockflow.com', password: 'Admin@123' });

  const cookie = res.headers['set-cookie']?.[0] || '';
  return { cookie, user: res.body.data?.user };
}

export async function loginAsStaff(): Promise<{ cookie: string; user: any }> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ali@stockflow.com', password: 'Staff@123' });

  const cookie = res.headers['set-cookie']?.[0] || '';
  return { cookie, user: res.body.data?.user };
}
