import request from 'supertest';
import { beforeAll, beforeEach } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';

beforeAll(async () => {
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
