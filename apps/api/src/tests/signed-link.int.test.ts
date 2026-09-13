import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { approvals } from '../../../../packages/kernel/src/approvals/index';
import { createSignedLink } from '../../../../packages/kernel/src/identity/index';
import { APPROVAL_LINK_PURPOSE } from '../http/principal';
import { addPerson, bodyOf, errorOf, signIn, startApi, type ApiHarness, type Person } from './api.fixture';
import { approvalDetailSchema, openApproval, registerLetterTool } from './approvals.fixture';

let api: ApiHarness;
let committee: Person;

beforeAll(async () => {
  api = await startApi();
  registerLetterTool();
  committee = await addPerson(api.tenant.tenantId, 'vybor-link@example.test', ['committee']);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

const linkFor = (subjectId: string): string =>
  createSignedLink({
    purpose: APPROVAL_LINK_PURPOSE,
    tenantId: api.tenant.tenantId,
    actorId: committee.userId,
    subjectId,
    expiresIn: 600,
  });

describe('approving from an e-mail', () => {
  it('renders the approval on GET without deciding it', async () => {
    const id = await openApproval(api.tenant.ctx, [committee.userId]);
    const preview = await api
      .http()
      .get(`/a/${linkFor(id)}`)
      .expect(200);

    expect(bodyOf(preview, approvalDetailSchema)).toMatchObject({ id, status: 'pending' });
    expect((await approvals.get(api.tenant.ctx, id)).status).toBe('pending');
  });

  it('decides on POST', async () => {
    const id = await openApproval(api.tenant.ctx, [committee.userId]);
    const token = linkFor(id);

    await api.http().get(`/a/${token}`).expect(200);
    await api.http().post(`/a/${token}/decide`).send({ decision: 'approved' }).expect(200);

    expect((await approvals.get(api.tenant.ctx, id)).status).toBe('approved');
  });

  it('refuses a link whose signature does not hold', async () => {
    const id = await openApproval(api.tenant.ctx, [committee.userId]);
    const response = await api
      .http()
      .get(`/a/${linkFor(id)}x`)
      .expect(401);

    expect(errorOf(response).code).toBe('signed_link_invalid');
  });

  it('decides only the approval the link was signed for', async () => {
    const signed = await openApproval(api.tenant.ctx, [committee.userId]);
    const other = await openApproval(api.tenant.ctx, [committee.userId]);

    await api
      .http()
      .post(`/a/${linkFor(signed)}/decide`)
      .send({ decision: 'approved' })
      .expect(200);

    expect((await approvals.get(api.tenant.ctx, other)).status).toBe('pending');
  });

  it('answers for the link, not for whoever happens to be signed in', async () => {
    const id = await openApproval(api.tenant.ctx, [committee.userId]);
    const stranger = await addPerson(api.tenant.tenantId, 'cizi@example.test', ['owner']);
    const cookie = await signIn(api, stranger);

    // The stranger may not decide anything, yet the link decides — it acts as its own addressee.
    await api
      .http()
      .post(`/a/${linkFor(id)}/decide`)
      .set('cookie', cookie)
      .send({ decision: 'approved' })
      .expect(200);

    expect((await approvals.get(api.tenant.ctx, id)).status).toBe('approved');
  });
});
