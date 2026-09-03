import request from 'supertest';
import { beforeAll, beforeEach } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

beforeAll(async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('postgres')) {
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'ignore',
      });
    } catch {
      // ignore
    }
  } else {
    const testDbPath = path.resolve(process.cwd(), 'prisma/test.db');
    if (!fs.existsSync(testDbPath) || fs.statSync(testDbPath).size < 1000) {
      try {
        execSync('npx prisma db push --skip-generate --accept-data-loss', {
          env: { ...process.env, DATABASE_URL: 'file:./test.db' },
          stdio: 'ignore',
        });
      } catch {
        // ignore if already created
      }
    }
  }
  await seedDatabase();
});

export async function loginAsAdmin(): Promise<{ cookie: string; user: any }> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ahmad@stockflow.com', password: 'Admin@123' });

  const cookie = res.headers['set-cookie']?.[0] || '';
  return { cookie, user: res.body.data.user };
}

export async function loginAsStaff(): Promise<{ cookie: string; user: any }> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ali@stockflow.com', password: 'Staff@123' });

  const cookie = res.headers['set-cookie']?.[0] || '';
  return { cookie, user: res.body.data.user };
}
