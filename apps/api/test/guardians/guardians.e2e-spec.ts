// test/guardians/guardians.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('Guardians (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let guardianId: string;
  let cpf: string;
  let cpfSeed = 200;
  const nextCPF = () => generateCPF(++cpfSeed);

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await loginAsAdmin(app);
    adminToken = admin.accessToken;

    const user = await loginAsUser(app);
    userToken = user.accessToken;

    cpf = nextCPF();
    const created = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Lookup Student',
        birthDate: '2020-01-01',
        guardian: { name: 'Searchable Guardian', cpf },
      })
      .expect(201);

    guardianId = created.body.guardianId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /guardians', () => {
    it('ADMIN — lists all guardians', async () => {
      const res = await request(app.getHttpServer())
        .get('/guardians')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('ADMIN — searches by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/guardians?q=Searchable')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.some((g: { id: string }) => g.id === guardianId)).toBe(true);
    });

    it('ADMIN — searches by cpf', async () => {
      const res = await request(app.getHttpServer())
        .get(`/guardians?q=${cpf}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(guardianId);
    });

    it('USER — cannot list (403)', async () => {
      await request(app.getHttpServer())
        .get('/guardians')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/guardians').expect(401);
    });
  });

  describe('GET /guardians/:id', () => {
    it('ADMIN — returns the guardian', async () => {
      const res = await request(app.getHttpServer())
        .get(`/guardians/${guardianId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: guardianId, cpf });
    });

    it('ADMIN — returns 404 for non-existent guardian', async () => {
      await request(app.getHttpServer())
        .get('/guardians/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot read (403)', async () => {
      await request(app.getHttpServer())
        .get(`/guardians/${guardianId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get(`/guardians/${guardianId}`).expect(401);
    });
  });

  describe('PATCH /guardians/:id', () => {
    it('ADMIN — updates name/phone/email', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/guardians/${guardianId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Guardian', phone: '11988887777', email: 'new@test.com' })
        .expect(200);

      expect(res.body).toMatchObject({
        id: guardianId,
        name: 'Updated Guardian',
        phone: '11988887777',
        email: 'new@test.com',
      });
    });

    it('ADMIN — updates cpf to a new valid cpf', async () => {
      const newCpf = nextCPF();

      const res = await request(app.getHttpServer())
        .patch(`/guardians/${guardianId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: newCpf })
        .expect(200);

      expect(res.body).toMatchObject({ id: guardianId, cpf: newCpf });
      cpf = newCpf;
    });

    it('ADMIN — rejects cpf that already belongs to another guardian (409)', async () => {
      const otherCpf = nextCPF();
      const created = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Other Student',
          birthDate: '2020-01-01',
          guardian: { name: 'Other Guardian', cpf: otherCpf },
        })
        .expect(201);

      const otherGuardianId: string = created.body.guardianId;

      await request(app.getHttpServer())
        .patch(`/guardians/${otherGuardianId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf })
        .expect(409);
    });

    it('ADMIN — rejects invalid cpf (400)', async () => {
      await request(app.getHttpServer())
        .patch(`/guardians/${guardianId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: '12345678900' })
        .expect(400);
    });

    it('ADMIN — returns 404 for non-existent guardian', async () => {
      await request(app.getHttpServer())
        .patch('/guardians/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' })
        .expect(404);
    });

    it('USER — cannot update (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/guardians/${guardianId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'X' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .patch(`/guardians/${guardianId}`)
        .send({ name: 'X' })
        .expect(401);
    });
  });
});
