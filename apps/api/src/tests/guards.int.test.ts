import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiToken } from '../../../../packages/kernel/src/identity/index';
import { newId, svjIdSchema, type SvjId } from '../../../../packages/kernel/src/ids/index';
import { startTestDb, withTestTenant } from '../../../../packages/kernel/src/testing/index';
import type { TestDatabase, TestTenant } from '../../../../packages/kernel/src/testing/index';
import { addPerson, errorOf, sessionCookieFor, type Person } from './api.fixture';
import { startProbeApp } from './guards.fixture';

let database: TestDatabase;
let tenant: TestTenant;
let app: NestFastifyApplication;
let finance: Person;

const svjA: SvjId = newId(svjIdSchema);
const svjB: SvjId = newId(svjIdSchema);

const http = (): TestAgent => request(app.getHttpServer());

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
  app = await startProbeApp();
  finance = await addPerson(tenant.tenantId, 'ucetni@example.test', ['finance']);
}, 180_000);

afterAll(async () => {
  await app.close();
  await database.stop();
});

describe('@Roles()', () => {
  it('lets a holder of the role through', async () => {
    const cookie = await sessionCookieFor(tenant.ctx, finance.userId);
    const response = await http().get('/probe/finance').set('cookie', cookie).expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('refuses someone with a different role', async () => {
    const technician = await addPerson(tenant.tenantId, 'technik@example.test', ['technician']);
    const cookie = await sessionCookieFor(tenant.ctx, technician.userId);

    const response = await http().get('/probe/finance').set('cookie', cookie).expect(403);
    expect(errorOf(response).code).toBe('role_required');
  });
});

describe('@RequireSvjAccess()', () => {
  it('refuses a request that names no SVJ', async () => {
    const cookie = await sessionCookieFor(tenant.ctx, finance.userId);
    const response = await http().get('/probe/svj').set('cookie', cookie).expect(403);

    expect(errorOf(response).code).toBe('svj_missing');
  });

  it('lets a tenant-wide role into any SVJ', async () => {
    const cookie = await sessionCookieFor(tenant.ctx, finance.userId);
    const response = await http().get('/probe/svj').set('cookie', cookie).set('x-svj-id', svjA).expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('keeps a role scoped to one SVJ out of another', async () => {
    const member = await addPerson(tenant.tenantId, 'vybor-a@example.test', ['committee'], svjA);
    const cookie = await sessionCookieFor(tenant.ctx, member.userId);

    await http().get('/probe/svj').set('cookie', cookie).set('x-svj-id', svjA).expect(200);

    const response = await http().get('/probe/svj').set('cookie', cookie).set('x-svj-id', svjB).expect(403);
    expect(errorOf(response).code).toBe('svj_forbidden');
  });

  it('keeps a token out of an SVJ its owner may reach but the token may not', async () => {
    const { token } = await createApiToken(tenant.ctx, {
      name: 'Jen SVJ A',
      ownerUserId: finance.userId,
      allowedTools: [],
      svjScope: [svjA],
    });
    const bearer = `Bearer ${token}`;

    await http().get('/probe/svj').set('authorization', bearer).set('x-svj-id', svjA).expect(200);

    const response = await http()
      .get('/probe/svj')
      .set('authorization', bearer)
      .set('x-svj-id', svjB)
      .expect(403);
    expect(errorOf(response).code).toBe('svj_outside_token_scope');
  });
});
