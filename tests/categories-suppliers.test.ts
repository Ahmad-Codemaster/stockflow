import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../server/app';
import prisma from '../server/db';
import { seedDatabase } from '../server/seed';
import { loginAsAdmin } from './setup';

describe('Categories & Suppliers CRUD', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('lists, creates, updates and deletes a category', async () => {
    const { cookie } = await loginAsAdmin();

    // 1. List
    const listRes = await request(app).get('/api/categories').set('Cookie', [cookie]);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(4);

    // 2. Create
    const createRes = await request(app)
      .post('/api/categories')
      .set('Cookie', [cookie])
      .send({ name: 'Networking Hardware', description: 'Routers, switches, and access points' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Networking Hardware');

    // 3. Reject duplicate category name
    const dupRes = await request(app)
      .post('/api/categories')
      .set('Cookie', [cookie])
      .send({ name: 'networking hardware' });
    expect(dupRes.status).toBe(409);

    // 4. Update
    const updateRes = await request(app)
      .put(`/api/categories/${createRes.body.data.id}`)
      .set('Cookie', [cookie])
      .send({ description: 'Updated description' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.description).toBe('Updated description');

    // 5. Delete empty category
    const deleteRes = await request(app)
      .delete(`/api/categories/${createRes.body.data.id}`)
      .set('Cookie', [cookie]);
    expect(deleteRes.status).toBe(200);

    // 6. Attempt deleting category in use (c1) -> fails with 400
    const inUseRes = await request(app)
      .delete('/api/categories/c1')
      .set('Cookie', [cookie]);
    expect(inUseRes.status).toBe(400);
    expect(inUseRes.body.error.code).toBe('CATEGORY_IN_USE');
  });

  it('lists, creates, updates and deletes a supplier', async () => {
    const { cookie } = await loginAsAdmin();

    // 1. List
    const listRes = await request(app).get('/api/suppliers').set('Cookie', [cookie]);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(3);

    // 2. Create
    const createRes = await request(app)
      .post('/api/suppliers')
      .set('Cookie', [cookie])
      .send({
        name: 'Apex Components Inc',
        contactPerson: 'Alice Wong',
        email: 'alice@apexcomponents.com',
        phone: '+1-555-9988',
        address: '500 Silicon Way, Sunnyvale, CA',
        leadTime: 4,
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Apex Components Inc');

    // 3. Update
    const updateRes = await request(app)
      .put(`/api/suppliers/${createRes.body.data.id}`)
      .set('Cookie', [cookie])
      .send({ phone: '+1-555-9999' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.phone).toBe('+1-555-9999');

    // 4. Delete
    const deleteRes = await request(app)
      .delete(`/api/suppliers/${createRes.body.data.id}`)
      .set('Cookie', [cookie]);
    expect(deleteRes.status).toBe(200);
  });
});
