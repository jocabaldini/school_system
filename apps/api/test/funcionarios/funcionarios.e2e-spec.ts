// test/funcionarios/funcionarios.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';
import { generateCPF } from '../helpers/cpf.helper';

describe('Funcionarios (e2e)', () => {
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

  // ─── POST /funcionarios ─────────────────────────────────────────────────────

  describe('POST /funcionarios', () => {
    it('ADMIN — creates a funcionario with cpf', async () => {
      const cpf = nextCPF();
      const res = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Funcionario Um', cargo: 'Professora', cpf })
        .expect(201);

      expect(res.body).toMatchObject({ nome: 'Funcionario Um', cargo: 'Professora', cpf });
      expect(res.body.deletedAt).toBeNull();
    });

    it('ADMIN — creates a funcionario without cpf', async () => {
      const res = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Funcionario Sem Cpf', cargo: 'Auxiliar' })
        .expect(201);

      expect(res.body).toMatchObject({ nome: 'Funcionario Sem Cpf', cpf: null });
    });

    it('ADMIN — rejects invalid cpf (400)', async () => {
      await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Cpf Invalido', cargo: 'Auxiliar', cpf: '11111111111' })
        .expect(400);
    });

    it('ADMIN — rejects duplicate cpf (409)', async () => {
      const cpf = nextCPF();
      await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Duplicado Um', cargo: 'Cozinheira', cpf })
        .expect(201);

      await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Duplicado Dois', cargo: 'Cozinheira', cpf })
        .expect(409);
    });

    it('USER — cannot create a funcionario (403)', async () => {
      await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nome: 'Forbidden', cargo: 'X' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .post('/funcionarios')
        .send({ nome: 'X', cargo: 'Y' })
        .expect(401);
    });
  });

  // ─── GET /funcionarios ──────────────────────────────────────────────────────

  describe('GET /funcionarios', () => {
    it('ADMIN — returns paginated list, active by default', async () => {
      const res = await request(app.getHttpServer())
        .get('/funcionarios?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ page: 1, limit: 5 });
      expect(Array.isArray(res.body.data)).toBe(true);
      for (const funcionario of res.body.data) {
        expect(funcionario.deletedAt).toBeNull();
      }
    });

    it('ADMIN — searches by nome', async () => {
      await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Nome Buscavel Unico', cargo: 'Diretora' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/funcionarios?q=Buscavel Unico')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.some((f: { nome: string }) => f.nome === 'Nome Buscavel Unico')).toBe(
        true,
      );
    });

    it('USER — cannot list (403)', async () => {
      await request(app.getHttpServer())
        .get('/funcionarios')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/funcionarios').expect(401);
    });
  });

  // ─── GET /funcionarios/:id ──────────────────────────────────────────────────

  describe('GET /funcionarios/:id', () => {
    it('ADMIN — returns the funcionario', async () => {
      const created = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Funcionario Detalhe', cargo: 'Zeladora' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/funcionarios/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: created.body.id, nome: 'Funcionario Detalhe' });
    });

    it('ADMIN — returns 404 for non-existent funcionario', async () => {
      await request(app.getHttpServer())
        .get('/funcionarios/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/funcionarios/someid').expect(401);
    });
  });

  // ─── PATCH /funcionarios/:id ────────────────────────────────────────────────

  describe('PATCH /funcionarios/:id', () => {
    it('ADMIN — updates nome/cargo/telefone/email', async () => {
      const created = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Funcionario Original', cargo: 'Auxiliar' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/funcionarios/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Funcionario Atualizado',
          cargo: 'Coordenadora',
          telefone: '11988887777',
          email: 'func@test.com',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        nome: 'Funcionario Atualizado',
        cargo: 'Coordenadora',
        telefone: '11988887777',
        email: 'func@test.com',
      });
    });

    it('ADMIN — updates cpf to a new valid cpf', async () => {
      const created = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Funcionario Cpf', cargo: 'Auxiliar' })
        .expect(201);

      const cpf = nextCPF();
      const res = await request(app.getHttpServer())
        .patch(`/funcionarios/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf })
        .expect(200);

      expect(res.body.cpf).toBe(cpf);
    });

    it('ADMIN — rejects cpf that already belongs to another funcionario (409)', async () => {
      const cpf = nextCPF();
      await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Dono Do Cpf', cargo: 'Auxiliar', cpf })
        .expect(201);

      const other = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Outro Funcionario', cargo: 'Auxiliar' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/funcionarios/${other.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf })
        .expect(409);
    });

    it('ADMIN — rejects invalid cpf (400)', async () => {
      const created = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Funcionario Invalido', cargo: 'Auxiliar' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/funcionarios/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: '11111111111' })
        .expect(400);
    });

    it('USER — cannot update (403)', async () => {
      await request(app.getHttpServer())
        .patch('/funcionarios/someid')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nome: 'Hacked' })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer())
        .patch('/funcionarios/someid')
        .send({ nome: 'X' })
        .expect(401);
    });
  });

  // ─── DELETE /funcionarios/:id + PATCH /funcionarios/:id/reativar ──────────

  describe('DELETE /funcionarios/:id and reactivate', () => {
    it('ADMIN — soft-deletes then reactivates a funcionario', async () => {
      const created = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Funcionario Ciclo', cargo: 'Auxiliar' })
        .expect(201);

      const deleted = await request(app.getHttpServer())
        .delete(`/funcionarios/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleted.body.deletedAt).not.toBeNull();

      const afterDelete = await request(app.getHttpServer())
        .get(`/funcionarios/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(afterDelete.body.deletedAt).not.toBeNull();

      const reactivated = await request(app.getHttpServer())
        .patch(`/funcionarios/${created.body.id}/reativar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(reactivated.body.deletedAt).toBeNull();

      const afterReactivate = await request(app.getHttpServer())
        .get(`/funcionarios/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(afterReactivate.body.deletedAt).toBeNull();
    });

    it('ADMIN — returns 404 when deleting non-existent funcionario', async () => {
      await request(app.getHttpServer())
        .delete('/funcionarios/nonexistentid123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('ADMIN — returns 404 when reactivating non-existent funcionario', async () => {
      await request(app.getHttpServer())
        .patch('/funcionarios/nonexistentid123/reativar')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('USER — cannot delete (403)', async () => {
      await request(app.getHttpServer())
        .delete('/funcionarios/someid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).delete('/funcionarios/someid').expect(401);
    });
  });
});
