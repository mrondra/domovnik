import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { approvals } from '../../../../packages/kernel/src/approvals/index';
import type { ApprovalId } from '../../../../packages/kernel/src/ids/index';
import { addPerson, bodyOf, errorOf, signIn, startApi, type ApiHarness, type Person } from './api.fixture';
import { issueToken, registerTokenTools } from './tokens.fixture';

let api: ApiHarness;
let manager: Person;
let cookie: string;

const meSchema = z.object({ userId: z.uuid().nullable(), credential: z.string() });

beforeAll(async () => {
  api = await startApi();
  registerTokenTools();
  manager = await addPerson(api.tenant.tenantId, 'token-spravce@example.test', ['manager']);
  cookie = await signIn(api, manager);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

const pending = (toolName: string): Promise<ApprovalId> =>
  approvals.create(api.tenant.ctx, {
    toolName,
    input: {},
    evidence: {},
    approvers: [manager.userId],
  });

describe('a request made with an API token', () => {
  it('acts as the token owner', async () => {
    const issued = await issueToken(api, cookie, ['letter.send']);
    const me = await api.http().get('/auth/me').set('authorization', `Bearer ${issued.token}`).expect(200);

    expect(bodyOf(me, meSchema)).toEqual({ userId: manager.userId, credential: 'api-token' });
  });

  it('refuses to decide an approval whose tool the token does not carry', async () => {
    const issued = await issueToken(api, cookie, ['letter.send']);
    const id = await pending('task.close');

    const response = await api
      .http()
      .post(`/approvals/${id}/decide`)
      .set('authorization', `Bearer ${issued.token}`)
      .send({ decision: 'approved' })
      .expect(403);

    expect(errorOf(response).code).toBe('tool_not_allowed_by_token');
    expect((await approvals.get(api.tenant.ctx, id)).status).toBe('pending');
  });

  it('decides an approval whose tool the token does carry', async () => {
    const issued = await issueToken(api, cookie, ['letter.send']);
    const id = await pending('letter.send');

    await api
      .http()
      .post(`/approvals/${id}/decide`)
      .set('authorization', `Bearer ${issued.token}`)
      .send({ decision: 'approved' })
      .expect(200);

    expect((await approvals.get(api.tenant.ctx, id)).status).toBe('approved');
  });

  it('sees the same inbox its owner sees', async () => {
    const issued = await issueToken(api, cookie, ['letter.send']);
    const id = await pending('letter.send');

    const response = await api
      .http()
      .get('/approvals')
      .set('authorization', `Bearer ${issued.token}`)
      .expect(200);

    expect(bodyOf(response, z.array(z.object({ id: z.uuid() }))).map((row) => row.id)).toContain(id);
  });
});
