// test/school-classes/school-classes.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('SchoolClasses (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let classSeed = 0;
  let cpfSeed = 500000;
  const nextName = () => `Class E2E ${Date.now()}-${++classSeed}`;
  const nextCPF = () => generateCPF(++cpfSeed);

  const createTeacher = async (name: string) => {
    const res = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name, position: 'Teacher' })
      .expect(201);
    return res.body.id as string;
  };

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

  // ─── POST /school-classes ───────────────────────────────────────────────────

  describe('POST /school-classes', () => {
    it('ADMIN — creates a school class with a teacher', async () => {
      const teacherId = await createTeacher('Teacher One');

      const res = await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      expect(res.body).toMatchObject({ schoolYear: 2026, maxCapacity: 10, teacherId });
      expect(res.body.deletedAt).toBeNull();
    });

    it('ADMIN — creates a school class with teacher and assistant', async () => {
      const teacherId = await createTeacher('Teacher Two');
      const assistantId = await createTeacher('Assistant Two');

      const res = await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId, assistantId })
        .expect(201);

      expect(res.body).toMatchObject({ teacherId, assistantId });
    });

    it('ADMIN — rejects non-existent teacherId (404)', async () => {
      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId: 'nonexistentid' })
        .expect(404);
    });

    it('ADMIN — rejects a soft-deleted teacher (404)', async () => {
      const teacherId = await createTeacher('Teacher Inactive');
      await request(app.getHttpServer())
        .delete(`/employees/${teacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(404);
    });

    it('ADMIN — rejects non-existent assistantId (404)', async () => {
      const teacherId = await createTeacher('Teacher Three');

      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: nextName(),
          schoolYear: 2026,
          maxCapacity: 10,
          teacherId,
          assistantId: 'nonexistentid',
        })
        .expect(404);
    });

    it('ADMIN — rejects duplicate name+schoolYear (409)', async () => {
      const teacherId = await createTeacher('Teacher Four');
      const name = nextName();

      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, schoolYear: 2026, maxCapacity: 5, teacherId })
        .expect(409);
    });

    it('ADMIN — allows same name in a different schoolYear', async () => {
      const teacherId = await createTeacher('Teacher Five');
      const name = nextName();

      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, schoolYear: 2027, maxCapacity: 10, teacherId })
        .expect(201);
    });

    it('USER — cannot create a school class (403)', async () => {
      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId: 'x' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .post('/school-classes')
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId: 'x' })
        .expect(401);
    });
  });

  // ─── GET /school-classes ────────────────────────────────────────────────────

  describe('GET /school-classes', () => {
    it('ADMIN — returns paginated list, active by default', async () => {
      const res = await request(app.getHttpServer())
        .get('/school-classes?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ page: 1, limit: 5 });
      expect(Array.isArray(res.body.data)).toBe(true);
      for (const schoolClass of res.body.data) {
        expect(schoolClass.deletedAt).toBeNull();
      }
    });

    it('ADMIN — filters by schoolYear', async () => {
      const teacherId = await createTeacher('Teacher Filter');
      const name = nextName();
      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, schoolYear: 2099, maxCapacity: 10, teacherId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/school-classes?schoolYear=2099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      for (const schoolClass of res.body.data) {
        expect(schoolClass.schoolYear).toBe(2099);
      }
    });

    it('ADMIN — searches by name', async () => {
      const teacherId = await createTeacher('Teacher Search');
      const name = `Searchable Unique Class ${Date.now()}`;
      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/school-classes?q=${encodeURIComponent('Searchable Unique')}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.some((c: { name: string }) => c.name === name)).toBe(true);
    });

    it('USER — cannot list (403)', async () => {
      await request(app.getHttpServer())
        .get('/school-classes')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/school-classes').expect(401);
    });
  });

  // ─── GET /school-classes/:id ────────────────────────────────────────────────

  describe('GET /school-classes/:id', () => {
    it('ADMIN — returns the school class', async () => {
      const teacherId = await createTeacher('Teacher Detail');
      const created = await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/school-classes/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: created.body.id, teacherId });
    });

    it('ADMIN — includes active enrollments with student info', async () => {
      const teacherId = await createTeacher('Teacher Enrollment Detail');
      const created = await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      const student = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Student Class Detail ${Date.now()}`,
          birthDate: '2020-01-01',
          guardian: { name: 'Guardian Class Detail', cpf: nextCPF() },
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/students/${student.body.id}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId: created.body.id,
          startTime: '07:00',
          endTime: '17:00',
          startDate: '2026-02-02',
          tuitionAmount: 100,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/school-classes/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.enrollments).toHaveLength(1);
      expect(res.body.enrollments[0].student).toMatchObject({ id: student.body.id });
    });

    it('ADMIN — returns 404 for non-existent school class', async () => {
      await request(app.getHttpServer())
        .get('/school-classes/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── PATCH /school-classes/:id ──────────────────────────────────────────────

  describe('PATCH /school-classes/:id', () => {
    it('ADMIN — updates maxCapacity', async () => {
      const teacherId = await createTeacher('Teacher Update');
      const created = await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/school-classes/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxCapacity: 20 })
        .expect(200);

      expect(res.body.maxCapacity).toBe(20);
    });

    it('ADMIN — rejects updating to a duplicate name+schoolYear (409)', async () => {
      const teacherId = await createTeacher('Teacher Update Dup');
      const nameA = nextName();
      const nameB = nextName();

      await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nameA, schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      const classB = await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nameB, schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/school-classes/${classB.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nameA })
        .expect(409);
    });

    it('ADMIN — returns 404 for non-existent school class', async () => {
      await request(app.getHttpServer())
        .patch('/school-classes/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxCapacity: 5 })
        .expect(404);
    });
  });

  // ─── DELETE /school-classes/:id ─────────────────────────────────────────────

  describe('DELETE /school-classes/:id', () => {
    it('ADMIN — soft-deletes a school class', async () => {
      const teacherId = await createTeacher('Teacher Delete');
      const created = await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: nextName(), schoolYear: 2026, maxCapacity: 10, teacherId })
        .expect(201);

      const deleted = await request(app.getHttpServer())
        .delete(`/school-classes/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleted.body.deletedAt).not.toBeNull();

      const afterDelete = await request(app.getHttpServer())
        .get(`/school-classes/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(afterDelete.body.deletedAt).not.toBeNull();
    });

    it('ADMIN — returns 404 when deleting non-existent school class', async () => {
      await request(app.getHttpServer())
        .delete('/school-classes/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot delete (403)', async () => {
      await request(app.getHttpServer())
        .delete('/school-classes/someid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
