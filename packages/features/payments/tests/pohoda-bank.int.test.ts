import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { fetchStatements, linkSvj } from '../../accounting-sync/index';
import { bankAdapterFor } from '../adapters/index';
import { syncBankAccount } from '../service/index';
import { browseTransactions } from '../service/browse';
import {
  seedPaidHouse,
  startPaymentsDb,
  withTestTenant,
  type PaidHouse,
  type TestDatabase,
} from './payments.fixture';

const RANGE = { from: '2026-09-01', to: '2026-09-30' } as const;

let database: TestDatabase;
let ctx: RequestContext;
let house: PaidHouse;

beforeAll(async () => {
  database = await startPaymentsDb();
  ctx = (await withTestTenant()).ctx;
  house = await seedPaidHouse(ctx, 3);

  await linkSvj(ctx, {
    svjId: house.svjId,
    companyIco: '26512345',
    config: { bankSource: 'pohoda' },
  });
}, 600_000);

afterAll(async () => {
  await database.stop();
});

/**
 * Zadání kap. 8 wants the statement primarily through Pohoda: the bank already tells the accounting
 * about every movement, so asking the bank a second time would leave two copies to reconcile.
 */
describe('a house whose statements come from the accounting', () => {
  it('is served by the Pohoda adapter, not by the generated bank', async () => {
    await expect(bankAdapterFor(ctx, house.svjId)).resolves.toMatchObject({ kind: 'pohoda' });
  });

  it('imports what the accounting holds', async () => {
    const result = await syncBankAccount(ctx, { bankAccountId: house.bankAccountId, ...RANGE });

    expect(result.count).toBeGreaterThan(0);
    await expect(browseTransactions(ctx, { svjId: house.svjId })).resolves.toHaveLength(result.count);
  }, 300_000);

  it('leaves the movements in the accounting, where they came from', async () => {
    const lines = await fetchStatements(ctx, { svjId: house.svjId, ...RANGE });
    const imported = await browseTransactions(ctx, { svjId: house.svjId });

    expect([...lines].map((one) => one.externalId).sort()).toStrictEqual(
      [...imported].map((one) => one.externalId).sort(),
    );
  });

  it('adds nothing when the same period is read again', async () => {
    const again = await syncBankAccount(ctx, { bankAccountId: house.bankAccountId, ...RANGE });

    expect(again.newCount).toBe(0);
  }, 300_000);
});
