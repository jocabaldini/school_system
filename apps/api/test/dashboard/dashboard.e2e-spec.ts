// test/dashboard/dashboard.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let cpfSeed = 800000;
  let classSeed = 0;
  const nextCPF = () => generateCPF(++cpfSeed);
  const nextClassName = () => `Dashboard Class ${Date.now()}-${++classSeed}`;

  // Far-future school year so this suite's class is guaranteed to be the max
  // schoolYear across the whole e2e run, regardless of what other suites create.
  const FUTURE_SCHOOL_YEAR = 2999;

  const createTeacher = async (name: string) => {
    const res = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name, position: 'Teacher' })
      .expect(201);
    return res.body.id as string;
  };

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

  describe('GET /dashboard/summary', () => {
    it('ADMIN — reflects a freshly created class and enrollment', async () => {
      const teacherId = await createTeacher(`Dashboard Teacher ${Date.now()}`);

      const schoolClass = await request(app.getHttpServer())
        .post('/school-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: nextClassName(),
          schoolYear: FUTURE_SCHOOL_YEAR,
          maxCapacity: 5,
          teacherId,
        })
        .expect(201);
      const schoolClassId = schoolClass.body.id as string;

      const studentId = await createStudent(`Dashboard Student ${Date.now()}`);

      await request(app.getHttpServer())
        .post(`/students/${studentId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClassId,
          startTime: '07:00',
          endTime: '17:00',
          startDate: `${FUTURE_SCHOOL_YEAR}-02-01`,
          tuitionAmount: 100,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.currentSchoolYear).toBe(FUTURE_SCHOOL_YEAR);
      expect(res.body.currentYearClassesCount).toBe(1);
      expect(res.body.classOccupancy).toEqual([
        { id: schoolClassId, name: expect.any(String), currentCount: 1, maxCapacity: 5 },
      ]);
      expect(typeof res.body.activeStudentsCount).toBe('number');
      expect(typeof res.body.activeEmployeesCount).toBe('number');
      expect(typeof res.body.activeEnrollmentsCount).toBe('number');
      expect(res.body.recentEnrollments.length).toBeLessThanOrEqual(5);
      expect(res.body.recentEnrollments[0]).toMatchObject({
        studentName: expect.any(String),
        className: expect.any(String),
        startDate: expect.any(String),
      });
    });

    it('USER — cannot read (403)', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/summary')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/dashboard/summary').expect(401);
    });
  });
});
