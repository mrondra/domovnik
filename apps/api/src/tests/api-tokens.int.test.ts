import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addPerson, bodyOf, errorOf, signIn, startApi, type ApiHarness, type Person } from './api.fixture';
import { issueToken, registerTokenTools } from './tokens.fixture';

let api: ApiHarness;
let manager: Person;
let cookie: string;

const listSchema = z.array(z.object({ id: z.uuid(), allowedTools: z.array(z.string()) }));
const toolsSchema = z.array(z.object({ name: z.string(), description: z.string() }));

beforeAll(async () => {
  api = await startApi();
  registerTokenTools();
  manager = await addPerson(api.tenant.tenantId, 'spravce@example.test', ['manager']);
  cookie = await signIn(api, manager);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

describe('POST /api-tokens', () => {
  it('returns the plaintext once and never lists it again', async () => {
    const issued = await issueToken(api, cookie, ['letter.send']);

    const listed = await api.http().get('/api-tokens').set('cookie', cookie).expect(200);
    expect(JSON.stringify(listed.body)).not.toContain(issued.token);
    expect(bodyOf(listed, listSchema).find((row) => row.id === issued.id)?.allowedTools).toEqual([
      'letter.send',
    ]);
  });

  it('refuses to issue a token wider than its owner', async () => {
    const response = await api
      .http()
      .post('/api-tokens')
      .set('cookie', cookie)
      .send({ name: 'Příliš mocný', allowedTools: ['payment.create'] })
      .expect(403);

    expect(errorOf(response).code).toBe('api_token_exceeds_owner');
  });
});

describe('GET /api-tokens/tools', () => {
  it('offers only the tools the caller is permitted to use', async () => {
    const response = await api.http().get('/api-tokens/tools').set('cookie', cookie).expect(200);
    const names = bodyOf(response, toolsSchema).map((row) => row.name);

    expect(names).toEqual(expect.arrayContaining(['letter.send', 'task.close']));
    expect(names).not.toContain('payment.create');
  });
});

describe('DELETE /api-tokens/:id', () => {
  it('stops the token being recognised at once', async () => {
    const issued = await issueToken(api, cookie, ['letter.send']);
    await api.http().delete(`/api-tokens/${issued.id}`).set('cookie', cookie).expect(200);

    const response = await api
      .http()
      .get('/auth/me')
      .set('authorization', `Bearer ${issued.token}`)
      .expect(401);
    expect(errorOf(response).code).toBe('api_token_invalid');
  });
});
