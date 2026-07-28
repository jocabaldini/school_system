// test/alunos/autorizados-busca.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('AutorizadosBusca (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let alunoId: string;
  let cpfSeed = 100;
  const nextCPF = () => generateCPF(++cpfSeed);

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await loginAsAdmin(app);
    adminToken = admin.accessToken;

    const user = await loginAsUser(app);
    userToken = user.accessToken;

    const created = await request(app.getHttpServer())
      .post('/alunos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Aluno Base',
        dataNascimento: '2020-01-01',
        responsavel: { nome: 'Responsavel Base', cpf: nextCPF() },
      })
      .expect(201);

    alunoId = created.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /alunos/:id/autorizados-busca', () => {
    it('ADMIN — creates an autorizado', async () => {
      const res = await request(app.getHttpServer())
        .post(`/alunos/${alunoId}/autorizados-busca`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Tio Fulano', parentesco: 'Tio', telefone: '11999999999' })
        .expect(201);

      expect(res.body).toMatchObject({ nome: 'Tio Fulano', parentesco: 'Tio', alunoId });
    });

    it('ADMIN — returns 404 when aluno does not exist', async () => {
      await request(app.getHttpServer())
        .post('/alunos/nonexistentid123/autorizados-busca')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'X', parentesco: 'Y' })
        .expect(404);
    });

    it('USER — cannot create (403)', async () => {
      await request(app.getHttpServer())
        .post(`/alunos/${alunoId}/autorizados-busca`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nome: 'X', parentesco: 'Y' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .post(`/alunos/${alunoId}/autorizados-busca`)
        .send({ nome: 'X', parentesco: 'Y' })
        .expect(401);
    });
  });

  describe('GET /alunos/:id/autorizados-busca', () => {
    it('ADMIN — lists autorizados for the aluno', async () => {
      const res = await request(app.getHttpServer())
        .get(`/alunos/${alunoId}/autorizados-busca`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('USER — cannot list (403)', async () => {
      await request(app.getHttpServer())
        .get(`/alunos/${alunoId}/autorizados-busca`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PATCH /alunos/:id/autorizados-busca/:autorizadoId', () => {
    it('ADMIN — updates an autorizado', async () => {
      const created = await request(app.getHttpServer())
        .post(`/alunos/${alunoId}/autorizados-busca`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Tia Original', parentesco: 'Tia' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/alunos/${alunoId}/autorizados-busca/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Tia Atualizada' })
        .expect(200);

      expect(res.body).toMatchObject({ nome: 'Tia Atualizada' });
    });

    it('ADMIN — returns 404 for non-existent autorizado', async () => {
      await request(app.getHttpServer())
        .patch(`/alunos/${alunoId}/autorizados-busca/nonexistentid123`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'X' })
        .expect(404);
    });

    it('USER — cannot update (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/alunos/${alunoId}/autorizados-busca/someid`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nome: 'X' })
        .expect(403);
    });
  });

  describe('DELETE /alunos/:id/autorizados-busca/:autorizadoId', () => {
    it('ADMIN — hard-deletes an autorizado', async () => {
      const created = await request(app.getHttpServer())
        .post(`/alunos/${alunoId}/autorizados-busca`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Para Remover', parentesco: 'Amigo' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/alunos/${alunoId}/autorizados-busca/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/alunos/${alunoId}/autorizados-busca/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'X' })
        .expect(404);
    });

    it('ADMIN — returns 404 for non-existent autorizado', async () => {
      await request(app.getHttpServer())
        .delete(`/alunos/${alunoId}/autorizados-busca/nonexistentid123`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot delete (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/alunos/${alunoId}/autorizados-busca/someid`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .delete(`/alunos/${alunoId}/autorizados-busca/someid`)
        .expect(401);
    });
  });
});
