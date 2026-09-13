import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { revokeSession } from '../../../../packages/kernel/src/identity/index';
import { z } from 'zod';
import { addPerson, bodyOf, errorOf, signIn, startApi, type ApiHarness, type Person } from './api.fixture';

const meBodySchema = z.object({
  tenantId: z.uuid(),
  userId: z.uuid().nullable(),
  roles: z.array(z.string()),
  credential: z.string(),
});

let api: ApiHarness;
let manager: Person;

beforeAll(async () => {
  api = await startApi();
  manager = await addPerson(api.tenant.tenantId, 'manager@example.test', ['manager']);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

describe('POST /auth/login', () => {
  it('answers with a session cookie a later request is recognised by', async () => {
    const cookie = await signIn(api, manager);
    expect(cookie).toMatch(/^domovnik_session=/);

    const me = await api.http().get('/auth/me').set('cookie', cookie).expect(200);
    expect(bodyOf(me, meBodySchema)).toMatchObject({
      tenantId: api.tenant.tenantId,
      userId: manager.userId,
      roles: ['manager'],
      credential: 'session',
    });
  });

  it('sets the cookie so script and cross-site POST cannot reach it', async () => {
    const response = await api
      .http()
      .post('/auth/login')
      .send({ email: manager.email, password: manager.password })
      .expect(200);

    const cookie = response.get('set-cookie')?.[0] ?? '';
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('refuses a wrong password without saying which half was wrong', async () => {
    const response = await api
      .http()
      .post('/auth/login')
      .send({ email: manager.email, password: 'špatné' })
      .expect(401);

    expect(errorOf(response).code).toBe('invalid_credentials');
    expect(errorOf(response).correlationId).toBeTruthy();
  });

  it('refuses a malformed body before it reaches the database', async () => {
    const response = await api.http().post('/auth/login').send({ email: 'nonsense' }).expect(400);
    expect(errorOf(response).code).toBe('request_invalid');
    expect(errorOf(response).details?.['issues']).toBeInstanceOf(Array);
  });
});

describe('identity on a request', () => {
  it('refuses a request that carries none', async () => {
    const response = await api.http().get('/auth/me').expect(401);
    expect(errorOf(response).code).toBe('unauthenticated');
  });

  it('refuses a session that has been revoked', async () => {
    const cookie = await signIn(api, manager);
    await api.http().get('/auth/me').set('cookie', cookie).expect(200);

    await revokeSession(api.tenant.ctx, cookie.split('=')[1] ?? '');
    const refused = await api.http().get('/auth/me').set('cookie', cookie).expect(401);
    expect(errorOf(refused).code).toBe('session_invalid');
  });

  it('stops recognising the session a logout ended', async () => {
    const cookie = await signIn(api, manager);
    await api.http().post('/auth/logout').set('cookie', cookie).expect(200);
    const refused = await api.http().get('/auth/me').set('cookie', cookie).expect(401);
    expect(errorOf(refused).code).toBe('session_invalid');
  });
});

describe('GET /health', () => {
  it('answers without a credential and reports the database', async () => {
    const response = await api.http().get('/health').expect(200);
    expect(bodyOf(response, z.object({ status: z.string(), database: z.string() }))).toEqual({
      status: 'ok',
      database: 'ok',
    });
  });
});
