import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { candidatesFor } from '../matching/search';
import { getTransaction, importTransactions, listUnmatched } from '../service/index';
import type { IncomingTransaction } from '../domain/types';
import {
  MONTHLY,
  seedPaidHouse,
  startPaymentsDb,
  withTestTenant,
  type PaidHouse,
  type TestDatabase,
} from './payments.fixture';

const UNITS = 4;
/** The house below is given January to March, so a statement is read in March. */
const BOOKED = '2026-03-14';

let database: TestDatabase;
let ctx: RequestContext;
let house: PaidHouse;

const symbolAt = (index: number): string => {
  const found = house.symbols[index];
  if (found === undefined) throw new RangeError(String(index));
  return found;
};

const swapLastTwo = (symbol: string): string =>
  symbol.slice(0, -2) + (symbol.at(-1) ?? '') + (symbol.at(-2) ?? '');

const importOne = (movement: IncomingTransaction) =>
  importTransactions(ctx, {
    svjId: house.svjId,
    bankAccountId: house.bankAccountId,
    transactions: [movement],
  });

const candidatesOf = async (externalId: string) => {
  const unmatched = await listUnmatched(ctx, house.svjId);
  const movement = unmatched.find((one) => one.externalId === externalId);
  if (movement === undefined) throw new RangeError(externalId);
  return candidatesFor(ctx, await getTransaction(ctx, movement.id));
};

beforeAll(async () => {
  database = await startPaymentsDb();
  ctx = (await withTestTenant()).ctx;
  house = await seedPaidHouse(ctx, UNITS, 3);
}, 300_000);

afterAll(async () => {
  await database.stop();
});

describe('what a movement could be about', () => {
  it('finds the prescription behind a swapped pair of digits', async () => {
    await importOne({
      externalId: 'typo',
      bookedOn: BOOKED,
      amount: MONTHLY,
      variableSymbol: swapLastTwo(symbolAt(1)),
    });

    const candidates = await candidatesOf('typo');

    expect(candidates.some((one) => one.because === 'symbol_typo')).toBe(true);
    expect(candidates.every((one) => one.targetType === 'prescription')).toBe(true);
  }, 300_000);

  it('finds two months added up in one transfer', async () => {
    await importOne({
      externalId: 'joint',
      bookedOn: BOOKED,
      amount: MONTHLY * 2,
      variableSymbol: symbolAt(2),
    });

    expect((await candidatesOf('joint')).some((one) => one.because === 'two_months')).toBe(true);
  }, 300_000);

  it('finds the unit whose whole debt is exactly what arrived, with no symbol at all', async () => {
    await importOne({ externalId: 'nosymbol', bookedOn: BOOKED, amount: MONTHLY * 3 });

    expect((await candidatesOf('nosymbol')).some((one) => one.because === 'balance_matches')).toBe(true);
  }, 300_000);

  it('offers nothing for a bank charge, which is the honest answer', async () => {
    await importOne({
      externalId: 'fee',
      bookedOn: BOOKED,
      amount: -49,
      counterpartyName: 'Poplatek za vedení účtu',
    });

    expect(await candidatesOf('fee')).toStrictEqual([]);
  }, 300_000);
});
