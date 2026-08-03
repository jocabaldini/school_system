// test/students/students.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('Students (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let cpfSeed = 0;
  const nextCPF = () => generateCPF(++cpfSeed);

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await loginAsAdmin(app);
    adminToken = admin.accessToken;

    const user = await loginAsUser(app);
    userToken = user.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /students ─────────────────────────────────────────────────────────

  describe('POST /students', () => {
    it('ADMIN — creates a student with inline guardian', async () => {
      const cpf = nextCPF();
      const res = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student One',
          birthDate: '2020-01-01',
          guardian: { name: 'Guardian One', cpf },
        })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Student One', deletedAt: null });
      expect(res.body.guardian).toMatchObject({ name: 'Guardian One', cpf });
    });

    it('ADMIN — creates a student with an existing guardianId', async () => {
      const cpf = nextCPF();
      const created = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sibling One',
          birthDate: '2019-01-01',
          guardian: { name: 'Guardian Two', cpf },
        })
        .expect(201);

      const guardianId: string = created.body.guardianId;

      const res = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sibling Two',
          birthDate: '2021-01-01',
          guardianId,
        })
        .expect(201);

      expect(res.body.guardianId).toBe(guardianId);
    });

    it('ADMIN — returns 404 when guardianId does not exist', async () => {
      await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'No Guardian',
          birthDate: '2020-01-01',
          guardianId: 'nonexistentid123',
        })
        .expect(404);
    });

    it('ADMIN — auto-links to existing guardian when inline cpf already exists (no 409, no duplicate)', async () => {
      const cpf = nextCPF();

      const first = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Child One',
          birthDate: '2018-01-01',
          guardian: { name: 'Shared Guardian', cpf },
        })
        .expect(201);

      const second = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Child Two',
          birthDate: '2020-06-01',
          guardian: { name: 'Shared Guardian', cpf },
        })
        .expect(201);

      expect(second.body.guardianId).toBe(first.body.guardianId);

      const listRes = await request(app.getHttpServer())
        .get(`/guardians?q=${cpf}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);
    });

    it('ADMIN — rejects invalid CPF (400)', async () => {
      await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid CPF',
          birthDate: '2020-01-01',
          guardian: { name: 'Invalid Guardian', cpf: '12345678900' },
        })
        .expect(400);
    });

    it('ADMIN — rejects when both guardianId and guardian are provided (400)', async () => {
      const cpf = nextCPF();
      await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Both',
          birthDate: '2020-01-01',
          guardianId: 'someid',
          guardian: { name: 'X', cpf },
        })
        .expect(400);
    });

    it('ADMIN — rejects when neither guardianId nor guardian is provided (400)', async () => {
      await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'None', birthDate: '2020-01-01' })
        .expect(400);
    });

    it('USER — cannot create a student (403)', async () => {
      await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Forbidden',
          birthDate: '2020-01-01',
          guardian: { name: 'Forbidden', cpf: nextCPF() },
        })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .post('/students')
        .send({ name: 'X', birthDate: '2020-01-01' })
        .expect(401);
    });
  });

  // ─── GET /students ──────────────────────────────────────────────────────────

  describe('GET /students', () => {
    it('ADMIN — returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/students?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ page: 1, limit: 2 });
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(typeof res.body.total).toBe('number');
    });

    it('ADMIN — filters by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/students?status=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const student of res.body.data) {
        expect(student.deletedAt).toBeNull();
      }
    });

    it('USER — cannot list students (403)', async () => {
      await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/students').expect(401);
    });
  });

  // ─── GET /students/:id ──────────────────────────────────────────────────────

  describe('GET /students/:id', () => {
    it('ADMIN — returns the student with guardian and authorizedPickups', async () => {
      const created = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student Detail',
          birthDate: '2020-01-01',
          guardian: { name: 'Guardian Detail', cpf: nextCPF() },
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/students/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('guardian');
      expect(res.body).toHaveProperty('authorizedPickups');
      expect(Array.isArray(res.body.authorizedPickups)).toBe(true);
    });

    it('ADMIN — returns 404 for non-existent student', async () => {
      await request(app.getHttpServer())
        .get('/students/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/students/someid').expect(401);
    });
  });

  // ─── PATCH /students/:id ────────────────────────────────────────────────────

  describe('PATCH /students/:id', () => {
    it('ADMIN — updates the student', async () => {
      const created = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student Original',
          birthDate: '2020-01-01',
          guardian: { name: 'Guardian Original', cpf: nextCPF() },
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/students/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Student Updated' })
        .expect(200);

      expect(res.body).toMatchObject({ name: 'Student Updated' });
    });

    it('USER — cannot update a student (403)', async () => {
      await request(app.getHttpServer())
        .patch('/students/someid')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).patch('/students/someid').send({ name: 'X' }).expect(401);
    });
  });

  // ─── DELETE /students/:id (soft delete) ─────────────────────────────────────

  describe('DELETE /students/:id', () => {
    it('ADMIN — soft-deletes the student (deletedAt set, row still exists)', async () => {
      const created = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student To Deactivate',
          birthDate: '2020-01-01',
          guardian: { name: 'Guardian To Deactivate', cpf: nextCPF() },
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/students/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
      expect(res.body.deletedAt).not.toBeNull();

      const afterDelete = await request(app.getHttpServer())
        .get(`/students/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(afterDelete.body.deletedAt).not.toBeNull();
    });

    it('ADMIN — returns 404 when deleting non-existent student', async () => {
      await request(app.getHttpServer())
        .delete('/students/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot delete a student (403)', async () => {
      await request(app.getHttpServer())
        .delete('/students/someid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).delete('/students/someid').expect(401);
    });
  });

  // ─── PATCH /students/:id/reactivate ─────────────────────────────────────────

  describe('PATCH /students/:id/reactivate', () => {
    it('ADMIN — reactivates a soft-deleted student (deletedAt back to null)', async () => {
      const created = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student To Reactivate',
          birthDate: '2020-01-01',
          guardian: { name: 'Guardian To Reactivate', cpf: nextCPF() },
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/students/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/students/${created.body.id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.deletedAt).toBeNull();

      const afterReactivate = await request(app.getHttpServer())
        .get(`/students/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(afterReactivate.body.deletedAt).toBeNull();
    });

    it('ADMIN — returns 404 for non-existent student', async () => {
      await request(app.getHttpServer())
        .patch('/students/nonexistentid123/reactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot reactivate (403)', async () => {
      await request(app.getHttpServer())
        .patch('/students/someid/reactivate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).patch('/students/someid/reactivate').expect(401);
    });
  });
});
