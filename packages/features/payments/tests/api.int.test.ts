import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  addPerson,
  bodyOf,
  signIn,
  startApi,
  type ApiHarness,
} from '../../../../apps/api/src/tests/api.fixture';
import { candidatesFor } from '../matching/search';
import { transactionDetailSchema, transactionListSchema } from '../domain/views';
import { getTransaction, importTransactions, listUnmatched } from '../service/index';
import { TEST_SCHEMA, seedHouseVia, type SeededHouse } from './api.fixture';

let api: ApiHarness;
let house: SeededHouse;
let movementId: string;
let targetId: string;
let accountant: string;
let chair: string;

beforeAll(async () => {
  api = await startApi(TEST_SCHEMA);
  house = await seedHouseVia(api);
  movementId = house.movementId;
  targetId = house.targetId;

  accountant = await signIn(api, await addPerson(api.tenant.tenantId, 'ucetni@example.test', ['finance']));
  chair = await signIn(
    api,
    await addPerson(api.tenant.tenantId, 'vybor@example.test', ['committee'], house.svjId),
  );
}, 600_000);

afterAll(async () => {
  await api.stop();
});

describe('reading the statement', () => {
  it('is open to the committee of that SVJ', async () => {
    const response = await api
      .http()
      .get(`/svj/${house.svjId}/transactions`)
      .set('cookie', chair)
      .expect(200);

    expect(bodyOf(response, transactionListSchema)).toHaveLength(1);
  });

  it('answers one movement with what it could be about', async () => {
    const response = await api.http().get(`/transactions/${movementId}`).set('cookie', chair).expect(200);

    const detail = bodyOf(response, transactionDetailSchema);
    expect(detail.transaction.matchStatus).toBe('unmatched');
    expect(detail.candidates.length).toBeGreaterThan(0);
  });

  it('answers 401 without a credential', async () => {
    expect((await api.http().get(`/svj/${house.svjId}/transactions`)).status).toBe(401);
  });
});

describe('deciding what a movement was about', () => {
  it('is refused to a committee member, who may look but not pair', async () => {
    const response = await api
      .http()
      .post(`/transactions/${movementId}/match`)
      .set('cookie', chair)
      .send({ targetType: 'prescription', targetId, amount: 3300 });

    expect(response.status).toBe(403);
  });

  it('is done by the accountant, and the movement says so afterwards', async () => {
    const response = await api
      .http()
      .post(`/transactions/${movementId}/match`)
      .set('cookie', accountant)
      .send({ targetType: 'prescription', targetId, amount: 3300 })
      .expect(200);

    expect(bodyOf(response, transactionDetailSchema).match).toMatchObject({ method: 'manual' });
    await expect(getTransaction(api.tenant.ctx, movementId as never)).resolves.toMatchObject({
      matchStatus: 'matched',
    });
    await expect(listUnmatched(api.tenant.ctx, house.svjId)).resolves.toStrictEqual([]);
  });

  it('refuses a target nobody computed', async () => {
    const imported = await importTransactions(api.tenant.ctx, {
      svjId: house.svjId,
      bankAccountId: house.bankAccountId,
      transactions: [{ externalId: 'odd', bookedOn: '2026-03-20', amount: 12_345, variableSymbol: '000000' }],
    });
    const odd = String(imported.unmatched[0] ?? '');
    const candidates = await candidatesFor(
      api.tenant.ctx,
      await getTransaction(api.tenant.ctx, odd as never),
    );

    const response = await api
      .http()
      .post(`/transactions/${odd}/match`)
      .set('cookie', accountant)
      .send({ targetType: 'prescription', targetId, amount: 12_345 });

    expect(response.status).toBe(422);
    expect(candidates.map((one) => one.targetId)).not.toContain(targetId);
  });
});
