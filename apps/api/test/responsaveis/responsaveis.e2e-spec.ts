// test/responsaveis/responsaveis.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('Responsaveis (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let responsavelId: string;
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
      .post('/alunos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Aluno Lookup',
        dataNascimento: '2020-01-01',
        responsavel: { nome: 'Responsavel Buscavel', cpf },
      })
      .expect(201);

    responsavelId = created.body.responsavelId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /responsaveis', () => {
    it('ADMIN — lists all responsaveis', async () => {
      const res = await request(app.getHttpServer())
        .get('/responsaveis')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('ADMIN — searches by nome', async () => {
      const res = await request(app.getHttpServer())
        .get('/responsaveis?q=Buscavel')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.some((r: { id: string }) => r.id === responsavelId)).toBe(true);
    });

    it('ADMIN — searches by cpf', async () => {
      const res = await request(app.getHttpServer())
        .get(`/responsaveis?q=${cpf}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(responsavelId);
    });

    it('USER — cannot list (403)', async () => {
      await request(app.getHttpServer())
        .get('/responsaveis')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/responsaveis').expect(401);
    });
  });

  describe('GET /responsaveis/:id', () => {
    it('ADMIN — returns the responsavel', async () => {
      const res = await request(app.getHttpServer())
        .get(`/responsaveis/${responsavelId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: responsavelId, cpf });
    });

    it('ADMIN — returns 404 for non-existent responsavel', async () => {
      await request(app.getHttpServer())
        .get('/responsaveis/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot read (403)', async () => {
      await request(app.getHttpServer())
        .get(`/responsaveis/${responsavelId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get(`/responsaveis/${responsavelId}`).expect(401);
    });
  });
});
