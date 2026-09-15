import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { approvals } from '../../../../packages/kernel/src/approvals/index';
import { withTestTenant } from '../../../../packages/kernel/src/testing/index';
import { addPerson, bodyOf, errorOf, idsOf, signIn, type ApiHarness, type Person } from './api.fixture';
import { startApi } from './api.fixture';
import { decisionSchema, openApproval, registerLetterTool, LETTER_TOOL } from './approvals.fixture';

let api: ApiHarness;
let committee: Person;
let cookie: string;

beforeAll(async () => {
  api = await startApi();
  registerLetterTool();
  committee = await addPerson(api.tenant.tenantId, 'vybor@example.test', ['committee']);
  cookie = await signIn(api, committee);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

describe('GET /approvals', () => {
  it('shows what this actor is asked to decide', async () => {
    const id = await openApproval(api.tenant.ctx, [committee.userId]);
    const response = await api.http().get('/approvals').set('cookie', cookie).expect(200);

    expect(idsOf(response)).toContain(id);
  });

  it('does not show an approval of another tenant', async () => {
    const other = await withTestTenant('Cizí správce');
    const foreign = await openApproval(other.ctx, []);

    const response = await api.http().get('/approvals').set('cookie', cookie).expect(200);
    expect(idsOf(response)).not.toContain(foreign);

    const refused = await api.http().get(`/approvals/${foreign}`).set('cookie', cookie).expect(404);
    expect(errorOf(refused).code).toBe('approval_not_found');
  });
});

describe('POST /approvals/:id/decide', () => {
  it('records the decision without running the deferred handler', async () => {
    const id = await openApproval(api.tenant.ctx, [committee.userId]);
    const response = await api
      .http()
      .post(`/approvals/${id}/decide`)
      .set('cookie', cookie)
      .send({ decision: 'approved' })
      .expect(200);

    expect(bodyOf(response, decisionSchema)).toEqual({ status: 'approved' });
    // The action itself belongs to the workers (ADR 0015); the API only releases it.
    expect(await approvals.get(api.tenant.ctx, id)).toMatchObject({ status: 'approved', executedAt: null });
  });

  it('refuses a second decision on the same approval', async () => {
    const id = await openApproval(api.tenant.ctx, [committee.userId]);
    const decide = () =>
      api.http().post(`/approvals/${id}/decide`).set('cookie', cookie).send({ decision: 'rejected' });

    await decide().expect(200);
    expect(errorOf(await decide().expect(409)).code).toBe('approval_already_decided');
  });

  it('refuses someone who is not among the approvers', async () => {
    const id = await openApproval(api.tenant.ctx, [api.tenant.adminId]);
    const response = await api
      .http()
      .post(`/approvals/${id}/decide`)
      .set('cookie', cookie)
      .send({ decision: 'approved' })
      .expect(403);

    expect(errorOf(response).code).toBe('approval_not_approver');
    expect((await approvals.get(api.tenant.ctx, id)).toolName).toBe(LETTER_TOOL);
    expect((await approvals.get(api.tenant.ctx, id)).status).toBe('pending');
  });
});
