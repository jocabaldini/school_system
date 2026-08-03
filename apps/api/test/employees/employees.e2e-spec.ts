// test/employees/employees.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('Employees (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let cpfSeed = 300;
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

  // ─── POST /employees ────────────────────────────────────────────────────────

  describe('POST /employees', () => {
    it('ADMIN — creates an employee with cpf', async () => {
      const cpf = nextCPF();
      const res = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Employee One', position: 'Teacher', cpf })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Employee One', position: 'Teacher', cpf });
      expect(res.body.deletedAt).toBeNull();
    });

    it('ADMIN — creates an employee without cpf', async () => {
      const res = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Employee Without Cpf', position: 'Assistant' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Employee Without Cpf', cpf: null });
    });

    it('ADMIN — rejects invalid cpf (400)', async () => {
      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Invalid Cpf', position: 'Assistant', cpf: '11111111111' })
        .expect(400);
    });

    it('ADMIN — rejects duplicate cpf (409)', async () => {
      const cpf = nextCPF();
      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Duplicate One', position: 'Cook', cpf })
        .expect(201);

      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Duplicate Two', position: 'Cook', cpf })
        .expect(409);
    });

    it('USER — cannot create an employee (403)', async () => {
      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Forbidden', position: 'X' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .post('/employees')
        .send({ name: 'X', position: 'Y' })
        .expect(401);
    });
  });

  // ─── GET /employees ─────────────────────────────────────────────────────────

  describe('GET /employees', () => {
    it('ADMIN — returns paginated list, active by default', async () => {
      const res = await request(app.getHttpServer())
        .get('/employees?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ page: 1, limit: 5 });
      expect(Array.isArray(res.body.data)).toBe(true);
      for (const employee of res.body.data) {
        expect(employee.deletedAt).toBeNull();
      }
    });

    it('ADMIN — searches by name', async () => {
      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Unique Searchable Name', position: 'Principal' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/employees?q=Searchable Name')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.some((e: { name: string }) => e.name === 'Unique Searchable Name')).toBe(
        true,
      );
    });

    it('USER — cannot list (403)', async () => {
      await request(app.getHttpServer())
        .get('/employees')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/employees').expect(401);
    });
  });

  // ─── GET /employees/:id ─────────────────────────────────────────────────────

  describe('GET /employees/:id', () => {
    it('ADMIN — returns the employee', async () => {
      const created = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Employee Detail', position: 'Janitor' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/employees/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: created.body.id, name: 'Employee Detail' });
    });

    it('ADMIN — returns 404 for non-existent employee', async () => {
      await request(app.getHttpServer())
        .get('/employees/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/employees/someid').expect(401);
    });
  });

  // ─── PATCH /employees/:id ───────────────────────────────────────────────────

  describe('PATCH /employees/:id', () => {
    it('ADMIN — updates name/position/phone/email', async () => {
      const created = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Employee Original', position: 'Assistant' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/employees/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Employee Updated',
          position: 'Coordinator',
          phone: '11988887777',
          email: 'employee@test.com',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        name: 'Employee Updated',
        position: 'Coordinator',
        phone: '11988887777',
        email: 'employee@test.com',
      });
    });

    it('ADMIN — updates cpf to a new valid cpf', async () => {
      const created = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Employee Cpf', position: 'Assistant' })
        .expect(201);

      const cpf = nextCPF();
      const res = await request(app.getHttpServer())
        .patch(`/employees/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf })
        .expect(200);

      expect(res.body.cpf).toBe(cpf);
    });

    it('ADMIN — rejects cpf that already belongs to another employee (409)', async () => {
      const cpf = nextCPF();
      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cpf Owner', position: 'Assistant', cpf })
        .expect(201);

      const other = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Other Employee', position: 'Assistant' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/employees/${other.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf })
        .expect(409);
    });

    it('ADMIN — rejects invalid cpf (400)', async () => {
      const created = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Invalid Employee', position: 'Assistant' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/employees/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: '11111111111' })
        .expect(400);
    });

    it('USER — cannot update (403)', async () => {
      await request(app.getHttpServer())
        .patch('/employees/someid')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).patch('/employees/someid').send({ name: 'X' }).expect(401);
    });
  });

  // ─── DELETE /employees/:id + PATCH /employees/:id/reactivate ──────────

  describe('DELETE /employees/:id and reactivate', () => {
    it('ADMIN — soft-deletes then reactivates an employee', async () => {
      const created = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Employee Cycle', position: 'Assistant' })
        .expect(201);

      const deleted = await request(app.getHttpServer())
        .delete(`/employees/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleted.body.deletedAt).not.toBeNull();

      const afterDelete = await request(app.getHttpServer())
        .get(`/employees/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(afterDelete.body.deletedAt).not.toBeNull();

      const reactivated = await request(app.getHttpServer())
        .patch(`/employees/${created.body.id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(reactivated.body.deletedAt).toBeNull();

      const afterReactivate = await request(app.getHttpServer())
        .get(`/employees/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(afterReactivate.body.deletedAt).toBeNull();
    });

    it('ADMIN — returns 404 when deleting non-existent employee', async () => {
      await request(app.getHttpServer())
        .delete('/employees/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('ADMIN — returns 404 when reactivating non-existent employee', async () => {
      await request(app.getHttpServer())
        .patch('/employees/nonexistentid123/reactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot delete (403)', async () => {
      await request(app.getHttpServer())
        .delete('/employees/someid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).delete('/employees/someid').expect(401);
    });
  });
});
