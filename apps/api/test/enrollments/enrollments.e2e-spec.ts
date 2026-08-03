// test/enrollments/enrollments.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('Enrollments (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let cpfSeed = 900;
  let classSeed = 0;
  const nextCPF = () => generateCPF(++cpfSeed);
  const nextClassName = () => `Enrollment Class ${Date.now()}-${++classSeed}`;

  const createStudent = async (name: string) => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name,
        birthDate: '2020-01-01',
        guardian: { name: `Guardian of ${name}`, cpf: nextCPF() },
      })
      .expect(201);
    return res.body.id as string;
  };

  const createSchoolClass = async (maxCapacity: number) => {
    const teacher = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Teacher Enrollment ${Date.now()}`, position: 'Teacher' })
      .expect(201);

    const schoolClass = await request(app.getHttpServer())
      .post('/school-classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: nextClassName(),
        schoolYear: 2026,
        maxCapacity,
        teacherId: teacher.body.id,
      })
      .expect(201);
    return schoolClass.body.id as string;
  };

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await loginAsAdmin(app);
    adminToken = admin.accessToken;

    const user = await loginAsUser(app);
    userToken = user.accessToken;

    // Fix Settings to known values so calculate() assertions are deterministic
    // regardless of what other e2e suites do to the shared singleton row.
    await request(app.getHttpServer())
      .patch('/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pricePerHour: 10, defaultSchoolDays: 20, latePenaltyPercentage: 10 })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /enrollments/calculate ────────────────────────────────────────────

  describe('POST /enrollments/calculate', () => {
    it('ADMIN — computes full-period hours (no break)', async () => {
      const res = await request(app.getHttpServer())
        .post('/enrollments/calculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTime: '07:00', endTime: '17:00' })
        .expect(201);

      expect(res.body.dailyHours).toBe(10);
      expect(res.body.suggestedAmount).toBe(10 * 10 * 20);
    });

    it('ADMIN — subtracts break from daily hours', async () => {
      const res = await request(app.getHttpServer())
        .post('/enrollments/calculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTime: '07:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' })
        .expect(201);

      expect(res.body.dailyHours).toBe(9);
      expect(res.body.suggestedAmount).toBe(9 * 10 * 20);
    });

    it('ADMIN — applies discountPercentage', async () => {
      const res = await request(app.getHttpServer())
        .post('/enrollments/calculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTime: '07:00', endTime: '17:00', discountPercentage: 10 })
        .expect(201);

      expect(res.body.suggestedAmount).toBe(10 * 10 * 20 * 0.9);
    });

    it('ADMIN — rejects invalid time format (400)', async () => {
      await request(app.getHttpServer())
        .post('/enrollments/calculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ startTime: '7h', endTime: '17:00' })
        .expect(400);
    });

    it('USER — cannot calculate (403)', async () => {
      await request(app.getHttpServer())
        .post('/enrollments/calculate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ startTime: '07:00', endTime: '17:00' })
        .expect(403);
    });
  });

  // ─── POST /students/:id/enrollments ─────────────────────────────────────────

  describe('POST /students/:studentId/enrollments', () => {
    it('ADMIN — creates an enrollment', async () => {
      const studentId = await createStudent('Enrollment Student One');
      const schoolClassId = await createSchoolClass(10);

      const res = await request(app.getHttpServer())
        .post(`/students/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId,
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1500,
          startDate: '2026-02-01',
        })
        .expect(201);

      expect(res.body).toMatchObject({ studentId, schoolClassId, endDate: null });
    });

    it('ADMIN — auto-closes the previous active enrollment', async () => {
      const studentId = await createStudent('Enrollment Student Two');
      const classA = await createSchoolClass(10);
      const classB = await createSchoolClass(10);

      const first = await request(app.getHttpServer())
        .post(`/students/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId: classA,
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1000,
          startDate: '2026-02-01',
        })
        .expect(201);

      const second = await request(app.getHttpServer())
        .post(`/students/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId: classB,
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1200,
          startDate: '2026-03-01',
        })
        .expect(201);

      expect(second.body.endDate).toBeNull();

      const history = await request(app.getHttpServer())
        .get(`/students/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const closedFirst = history.body.find((e: { id: string }) => e.id === first.body.id);
      expect(closedFirst.endDate).not.toBeNull();
      expect(new Date(closedFirst.endDate).toISOString().slice(0, 10)).toBe('2026-02-28');
    });

    it('ADMIN — rejects enrollment when school class is at full capacity (409)', async () => {
      const schoolClassId = await createSchoolClass(1);
      const studentA = await createStudent('Enrollment Capacity One');
      const studentB = await createStudent('Enrollment Capacity Two');

      await request(app.getHttpServer())
        .post(`/students/${studentA}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId,
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1000,
          startDate: '2026-02-01',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/students/${studentB}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId,
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1000,
          startDate: '2026-02-01',
        })
        .expect(409);
    });

    it('ADMIN — returns 404 for non-existent student', async () => {
      const schoolClassId = await createSchoolClass(10);
      await request(app.getHttpServer())
        .post('/students/nonexistentid123/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId,
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1000,
          startDate: '2026-02-01',
        })
        .expect(404);
    });

    it('ADMIN — returns 404 for non-existent school class', async () => {
      const studentId = await createStudent('Enrollment Class Missing');
      await request(app.getHttpServer())
        .post(`/students/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId: 'nonexistentid123',
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1000,
          startDate: '2026-02-01',
        })
        .expect(404);
    });

    it('USER — cannot create an enrollment (403)', async () => {
      await request(app.getHttpServer())
        .post('/students/someid/enrollments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          schoolClassId: 'x',
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1000,
          startDate: '2026-02-01',
        })
        .expect(403);
    });
  });

  // ─── GET /students/:id/enrollments ──────────────────────────────────────────

  describe('GET /students/:studentId/enrollments', () => {
    it('ADMIN — returns full enrollment history', async () => {
      const studentId = await createStudent('Enrollment History Student');
      const schoolClassId = await createSchoolClass(10);

      await request(app.getHttpServer())
        .post(`/students/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId,
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1000,
          startDate: '2026-02-01',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/students/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].studentId).toBe(studentId);
    });

    it('ADMIN — returns 404 for non-existent student', async () => {
      await request(app.getHttpServer())
        .get('/students/nonexistentid123/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── PATCH /students/:id/enrollments/:enrollmentId ──────────────────────────

  describe('PATCH /students/:studentId/enrollments/:enrollmentId', () => {
    it('ADMIN — manually closes an enrollment by setting endDate', async () => {
      const studentId = await createStudent('Enrollment Manual Close');
      const schoolClassId = await createSchoolClass(10);

      const created = await request(app.getHttpServer())
        .post(`/students/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId,
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1000,
          startDate: '2026-02-01',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/students/${studentId}/enrollments/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ endDate: '2026-06-30' })
        .expect(200);

      expect(res.body.endDate).not.toBeNull();
    });

    it('ADMIN — returns 404 for an enrollment that does not belong to the student', async () => {
      const studentA = await createStudent('Enrollment Owner');
      const studentB = await createStudent('Enrollment Not Owner');
      const schoolClassId = await createSchoolClass(10);

      const created = await request(app.getHttpServer())
        .post(`/students/${studentA}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId,
          startTime: '07:00',
          endTime: '17:00',
          tuitionAmount: 1000,
          startDate: '2026-02-01',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/students/${studentB}/enrollments/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ endDate: '2026-06-30' })
        .expect(404);
    });

    it('USER — cannot update (403)', async () => {
      await request(app.getHttpServer())
        .patch('/students/someid/enrollments/otherid')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ endDate: '2026-06-30' })
        .expect(403);
    });
  });
});
