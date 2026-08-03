// test/students/authorized-pickups.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('AuthorizedPickups (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let studentId: string;
  let cpfSeed = 100;
  const nextCPF = () => generateCPF(++cpfSeed);

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await loginAsAdmin(app);
    adminToken = admin.accessToken;

    const user = await loginAsUser(app);
    userToken = user.accessToken;

    const created = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Base Student',
        birthDate: '2020-01-01',
        guardian: { name: 'Base Guardian', cpf: nextCPF() },
      })
      .expect(201);

    studentId = created.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /students/:id/authorized-pickups', () => {
    it('ADMIN — creates an authorized pickup', async () => {
      const res = await request(app.getHttpServer())
        .post(`/students/${studentId}/authorized-pickups`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Uncle Someone', relationship: 'Uncle', phone: '11999999999' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Uncle Someone', relationship: 'Uncle', studentId });
    });

    it('ADMIN — returns 404 when student does not exist', async () => {
      await request(app.getHttpServer())
        .post('/students/nonexistentid123/authorized-pickups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X', relationship: 'Y' })
        .expect(404);
    });

    it('USER — cannot create (403)', async () => {
      await request(app.getHttpServer())
        .post(`/students/${studentId}/authorized-pickups`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'X', relationship: 'Y' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .post(`/students/${studentId}/authorized-pickups`)
        .send({ name: 'X', relationship: 'Y' })
        .expect(401);
    });
  });

  describe('GET /students/:id/authorized-pickups', () => {
    it('ADMIN — lists authorized pickups for the student', async () => {
      const res = await request(app.getHttpServer())
        .get(`/students/${studentId}/authorized-pickups`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('USER — cannot list (403)', async () => {
      await request(app.getHttpServer())
        .get(`/students/${studentId}/authorized-pickups`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PATCH /students/:id/authorized-pickups/:pickupId', () => {
    it('ADMIN — updates an authorized pickup', async () => {
      const created = await request(app.getHttpServer())
        .post(`/students/${studentId}/authorized-pickups`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Aunt Original', relationship: 'Aunt' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/students/${studentId}/authorized-pickups/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Aunt Updated' })
        .expect(200);

      expect(res.body).toMatchObject({ name: 'Aunt Updated' });
    });

    it('ADMIN — returns 404 for non-existent authorized pickup', async () => {
      await request(app.getHttpServer())
        .patch(`/students/${studentId}/authorized-pickups/nonexistentid123`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' })
        .expect(404);
    });

    it('USER — cannot update (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/students/${studentId}/authorized-pickups/someid`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'X' })
        .expect(403);
    });
  });

  describe('DELETE /students/:id/authorized-pickups/:pickupId', () => {
    it('ADMIN — hard-deletes an authorized pickup', async () => {
      const created = await request(app.getHttpServer())
        .post(`/students/${studentId}/authorized-pickups`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'To Remove', relationship: 'Friend' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/students/${studentId}/authorized-pickups/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/students/${studentId}/authorized-pickups/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' })
        .expect(404);
    });

    it('ADMIN — returns 404 for non-existent authorized pickup', async () => {
      await request(app.getHttpServer())
        .delete(`/students/${studentId}/authorized-pickups/nonexistentid123`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot delete (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/students/${studentId}/authorized-pickups/someid`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .delete(`/students/${studentId}/authorized-pickups/someid`)
        .expect(401);
    });
  });
});
