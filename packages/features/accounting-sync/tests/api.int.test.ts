import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bodyOf, type ApiHarness } from '../../../../apps/api/src/tests/api.fixture';
import { accountingStatusSchema, conflictSchema, syncStatementsResponse } from '../domain/views';
import { listConflicts } from '../service/index';
import { startAccountingApi } from './api.fixture';
import type { LinkedHouse } from './flow.fixture';

let api: ApiHarness;
let house: LinkedHouse;
let accountant: string;
let chair: string;
let conflictId: string;

beforeAll(async () => {
  const world = await startAccountingApi();
  ({ api, house, accountant, chair, conflictId } = world);
}, 600_000);

afterAll(async () => {
  await api.stop();
});

describe('the state of the connection to the accounting', () => {
  it('is open to the committee of that SVJ', async () => {
    const response = await api.http().get(`/svj/${house.svjId}/accounting`).set('cookie', chair).expect(200);

    const status = bodyOf(response, accountingStatusSchema);
    expect(status.link).toMatchObject({ companyIco: house.ico, accountingAdapter: 'mock' });
    expect(status.conflicts).toHaveLength(1);
    expect(status.jobs.length).toBeGreaterThan(0);
  });

  it('answers 401 without a credential', async () => {
    expect((await api.http().get(`/svj/${house.svjId}/accounting`)).status).toBe(401);
  });
});

describe('asking the accounting for a statement', () => {
  it('is refused to a committee member, who may look but not sync', async () => {
    const response = await api
      .http()
      .post(`/svj/${house.svjId}/accounting/sync-statements`)
      .set('cookie', chair)
      .send({ from: '2026-09-01', to: '2026-09-30' });

    expect(response.status).toBe(403);
  });

  it('is done by the accountant, and says how many lines Pohoda has', async () => {
    const response = await api
      .http()
      .post(`/svj/${house.svjId}/accounting/sync-statements`)
      .set('cookie', accountant)
      .send({ from: '2026-09-01', to: '2026-09-30' })
      .expect(200);

    expect(bodyOf(response, syncStatementsResponse).count).toBeGreaterThanOrEqual(0);
  });
});

describe('closing a disagreement', () => {
  it('is refused to a committee member', async () => {
    const response = await api
      .http()
      .post(`/conflicts/${conflictId}/resolve`)
      .set('cookie', chair)
      .send({ resolution: 'take_theirs', note: 'Ať platí Pohoda.' });

    expect(response.status).toBe(403);
  });

  it('is the accountant’s decision, and the conflict says so afterwards', async () => {
    const response = await api
      .http()
      .post(`/conflicts/${conflictId}/resolve`)
      .set('cookie', accountant)
      .send({ resolution: 'take_theirs', note: 'Faktura byla opravena podle dokladu.' })
      .expect(200);

    expect(bodyOf(response, conflictSchema)).toMatchObject({ status: 'resolved' });
    await expect(listConflicts(api.tenant.ctx, house.svjId, 'open')).resolves.toStrictEqual([]);
  });
});
