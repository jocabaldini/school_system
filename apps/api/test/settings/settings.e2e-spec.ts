// test/settings/settings.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.helper';

describe('Settings (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

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

  // ─── GET /settings ──────────────────────────────────────────────────────────

  describe('GET /settings', () => {
    it('ADMIN — returns the singleton settings', async () => {
      const res = await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('pricePerHour');
      expect(res.body).toHaveProperty('defaultSchoolDays');
      expect(res.body).toHaveProperty('latePenaltyPercentage');
    });

    it('USER — cannot read (403)', async () => {
      await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).get('/settings').expect(401);
    });
  });

  // ─── PATCH /settings ────────────────────────────────────────────────────────

  describe('PATCH /settings', () => {
    it('ADMIN — updates the singleton row without ever creating a second one', async () => {
      const before = await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch('/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ pricePerHour: 12.5, defaultSchoolDays: 22, latePenaltyPercentage: 8 })
        .expect(200);

      const afterFirstUpdate = await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(afterFirstUpdate.body.id).toBe(before.body.id);
      expect(Number(afterFirstUpdate.body.pricePerHour)).toBe(12.5);
      expect(afterFirstUpdate.body.defaultSchoolDays).toBe(22);

      await request(app.getHttpServer())
        .patch('/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ pricePerHour: 15 })
        .expect(200);

      const afterSecondUpdate = await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Same row id both times — PATCH never creates a second Settings row.
      expect(afterSecondUpdate.body.id).toBe(before.body.id);
      expect(Number(afterSecondUpdate.body.pricePerHour)).toBe(15);
    });

    it('USER — cannot update (403)', async () => {
      await request(app.getHttpServer())
        .patch('/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ pricePerHour: 1 })
        .expect(403);
    });

    it('unauthenticated — returns 401', async () => {
      await request(app.getHttpServer()).patch('/settings').send({ pricePerHour: 1 }).expect(401);
    });
  });
});
