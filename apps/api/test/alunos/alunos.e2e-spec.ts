// test/alunos/alunos.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('Alunos (e2e)', () => {
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

  // ─── POST /alunos ──────────────────────────────────────────────────────────

  describe('POST /alunos', () => {
    it('ADMIN — creates an aluno with inline responsavel', async () => {
      const cpf = nextCPF();
      const res = await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Aluno Um',
          dataNascimento: '2020-01-01',
          responsavel: { nome: 'Responsavel Um', cpf },
        })
        .expect(201);

      expect(res.body).toMatchObject({ nome: 'Aluno Um', status: 'ATIVO' });
      expect(res.body.responsavel).toMatchObject({ nome: 'Responsavel Um', cpf });
    });

    it('ADMIN — creates an aluno with an existing responsavelId', async () => {
      const cpf = nextCPF();
      const created = await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Irmao Um',
          dataNascimento: '2019-01-01',
          responsavel: { nome: 'Responsavel Dois', cpf },
        })
        .expect(201);

      const responsavelId: string = created.body.responsavelId;

      const res = await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Irmao Dois',
          dataNascimento: '2021-01-01',
          responsavelId,
        })
        .expect(201);

      expect(res.body.responsavelId).toBe(responsavelId);
    });

    it('ADMIN — returns 404 when responsavelId does not exist', async () => {
      await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Sem Responsavel',
          dataNascimento: '2020-01-01',
          responsavelId: 'nonexistentid123',
        })
        .expect(404);
    });

    it('ADMIN — auto-links to existing responsavel when inline cpf already exists (no 409, no duplicate)', async () => {
      const cpf = nextCPF();

      const first = await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Filho Um',
          dataNascimento: '2018-01-01',
          responsavel: { nome: 'Responsavel Compartilhado', cpf },
        })
        .expect(201);

      const second = await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Filho Dois',
          dataNascimento: '2020-06-01',
          responsavel: { nome: 'Responsavel Compartilhado', cpf },
        })
        .expect(201);

      expect(second.body.responsavelId).toBe(first.body.responsavelId);

      const listRes = await request(app.getHttpServer())
        .get(`/responsaveis?q=${cpf}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);
    });

    it('ADMIN — rejects invalid CPF (400)', async () => {
      await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'CPF Invalido',
          dataNascimento: '2020-01-01',
          responsavel: { nome: 'Responsavel Invalido', cpf: '12345678900' },
        })
        .expect(400);
    });

    it('ADMIN — rejects when both responsavelId and responsavel are provided (400)', async () => {
      const cpf = nextCPF();
      await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Ambos',
          dataNascimento: '2020-01-01',
          responsavelId: 'someid',
          responsavel: { nome: 'X', cpf },
        })
        .expect(400);
    });

    it('ADMIN — rejects when neither responsavelId nor responsavel is provided (400)', async () => {
      await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Nenhum', dataNascimento: '2020-01-01' })
        .expect(400);
    });

    it('USER — cannot create an aluno (403)', async () => {
      await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nome: 'Forbidden',
          dataNascimento: '2020-01-01',
          responsavel: { nome: 'Forbidden', cpf: nextCPF() },
        })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .post('/alunos')
        .send({ nome: 'X', dataNascimento: '2020-01-01' })
        .expect(401);
    });
  });

  // ─── GET /alunos ───────────────────────────────────────────────────────────

  describe('GET /alunos', () => {
    it('ADMIN — returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/alunos?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ page: 1, limit: 2 });
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(typeof res.body.total).toBe('number');
    });

    it('ADMIN — filters by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/alunos?status=ATIVO')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const aluno of res.body.data) {
        expect(aluno.status).toBe('ATIVO');
      }
    });

    it('USER — cannot list alunos (403)', async () => {
      await request(app.getHttpServer())
        .get('/alunos')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/alunos').expect(401);
    });
  });

  // ─── GET /alunos/:id ───────────────────────────────────────────────────────

  describe('GET /alunos/:id', () => {
    it('ADMIN — returns the aluno with responsavel and autorizadosBusca', async () => {
      const created = await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Aluno Detalhe',
          dataNascimento: '2020-01-01',
          responsavel: { nome: 'Responsavel Detalhe', cpf: nextCPF() },
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/alunos/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('responsavel');
      expect(res.body).toHaveProperty('autorizadosBusca');
      expect(Array.isArray(res.body.autorizadosBusca)).toBe(true);
    });

    it('ADMIN — returns 404 for non-existent aluno', async () => {
      await request(app.getHttpServer())
        .get('/alunos/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/alunos/someid').expect(401);
    });
  });

  // ─── PATCH /alunos/:id ─────────────────────────────────────────────────────

  describe('PATCH /alunos/:id', () => {
    it('ADMIN — updates the aluno', async () => {
      const created = await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Aluno Original',
          dataNascimento: '2020-01-01',
          responsavel: { nome: 'Responsavel Original', cpf: nextCPF() },
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/alunos/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Aluno Atualizado' })
        .expect(200);

      expect(res.body).toMatchObject({ nome: 'Aluno Atualizado' });
    });

    it('USER — cannot update an aluno (403)', async () => {
      await request(app.getHttpServer())
        .patch('/alunos/someid')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nome: 'Hacked' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).patch('/alunos/someid').send({ nome: 'X' }).expect(401);
    });
  });

  // ─── DELETE /alunos/:id (soft delete) ──────────────────────────────────────

  describe('DELETE /alunos/:id', () => {
    it('ADMIN — soft-deletes the aluno (status -> INATIVO, row still exists)', async () => {
      const created = await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Aluno Para Inativar',
          dataNascimento: '2020-01-01',
          responsavel: { nome: 'Responsavel Para Inativar', cpf: nextCPF() },
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/alunos/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: created.body.id, status: 'INATIVO' });

      const afterDelete = await request(app.getHttpServer())
        .get(`/alunos/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(afterDelete.body.status).toBe('INATIVO');
    });

    it('ADMIN — returns 404 when deleting non-existent aluno', async () => {
      await request(app.getHttpServer())
        .delete('/alunos/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot delete an aluno (403)', async () => {
      await request(app.getHttpServer())
        .delete('/alunos/someid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).delete('/alunos/someid').expect(401);
    });
  });
});
