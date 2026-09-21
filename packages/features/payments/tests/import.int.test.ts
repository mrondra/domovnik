import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { unitBalance } from '../../receivables/index';
import { transactionsUnmatched } from '../domain/events';
import type { IncomingTransaction } from '../domain/types';
import { importTransactions } from '../service/index';
import {
  MONTHLY,
  eventCount,
  eventPayloads,
  seedPaidHouse,
  startPaymentsDb,
  withTestTenant,
  type PaidHouse,
  type TestDatabase,
} from './payments.fixture';

const UNITS = 200;
const PAYING = 195;

let database: TestDatabase;
let ctx: RequestContext;
let house: PaidHouse;

/** Every unit pays its own symbol; the last five pay somebody else's, which no rule can settle. */
const statement = (): readonly IncomingTransaction[] =>
  house.symbols.map((symbol, index) => ({
    externalId: `2026-09-${String(index).padStart(4, '0')}`,
    bookedOn: '2026-09-14',
    amount: MONTHLY,
    counterpartyName: `Plátce ${String(index + 1)}`,
    variableSymbol: index < PAYING ? symbol : '999999',
  }));

beforeAll(async () => {
  database = await startPaymentsDb();
  ctx = (await withTestTenant()).ctx;
  house = await seedPaidHouse(ctx, UNITS);
}, 600_000);

afterAll(async () => {
  await database.stop();
});

describe('importing a statement', () => {
  it('settles what the rules can and asks about the rest exactly once', async () => {
    const result = await importTransactions(ctx, {
      svjId: house.svjId,
      bankAccountId: house.bankAccountId,
      transactions: statement(),
    });

    expect(result).toMatchObject({
      count: UNITS,
      newCount: UNITS,
      matchedCount: PAYING,
    });
    expect(result.unmatched).toHaveLength(UNITS - PAYING);
    await expect(eventCount(ctx, transactionsUnmatched.name)).resolves.toBe(1);
  }, 600_000);

  it('names every unsettled movement in that one event', async () => {
    const payloads = await eventPayloads(ctx, transactionsUnmatched.name);
    const payload = z.object({ transactionIds: z.array(z.uuid()) }).parse(payloads[0] ?? {});

    expect(payload.transactionIds).toHaveLength(UNITS - PAYING);
  });

  it('writes the money it settled into the ledger of the unit that paid', async () => {
    const unit = house.units[0];
    if (unit === undefined) throw new RangeError('fixture');

    await expect(unitBalance(ctx, { svjId: house.svjId, unitId: unit.id })).resolves.toMatchObject({
      balance: 0,
      oldestUnpaidPeriod: undefined,
    });
  });

  it('adds nothing when the same statement arrives again', async () => {
    const again = await importTransactions(ctx, {
      svjId: house.svjId,
      bankAccountId: house.bankAccountId,
      transactions: statement(),
    });

    expect(again).toMatchObject({ count: UNITS, newCount: 0, matchedCount: 0 });
    expect(again.unmatched).toStrictEqual([]);
    await expect(eventCount(ctx, transactionsUnmatched.name)).resolves.toBe(1);
  }, 600_000);
});
