import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { listDebtors } from '../../receivables/index';
import { bankAdapter } from '../adapters/index';
import type { BankAccountId } from '../domain/ids';
import { syncBankAccount } from '../service/index';
import {
  MONTHLY,
  seedPaidHouse,
  startPaymentsDb,
  withTestTenant,
  type TestDatabase,
} from './payments.fixture';

const UNITS = 8;
const MONTHS = 12;
const RANGE = { from: '2026-01-01', to: '2026-12-31' } as const;

interface House {
  readonly svjId: SvjId;
  readonly bankAccountId: BankAccountId;
}

let database: TestDatabase;
let ctx: RequestContext;
/** The houses in the order they were taken on, which is the order the profiles are written in. */
let houses: readonly House[];

beforeAll(async () => {
  database = await startPaymentsDb();
  ctx = (await withTestTenant()).ctx;

  const seeded: House[] = [];
  for (let index = 0; index < 3; index += 1) {
    const house = await seedPaidHouse(ctx, UNITS, MONTHS);
    seeded.push({ svjId: house.svjId, bankAccountId: house.bankAccountId });
  }
  houses = seeded;
}, 600_000);

afterAll(async () => {
  await database.stop();
});

const houseAt = (index: number): House => {
  const found = houses[index];
  if (found === undefined) throw new RangeError(String(index));
  return found;
};

const sync = (house: House) => syncBankAccount(ctx, { bankAccountId: house.bankAccountId, ...RANGE });

describe('the generated statement', () => {
  it('is the same statement every time it is asked for', async () => {
    const house = houseAt(0);
    const [first, again] = await Promise.all([
      bankAdapter().fetchTransactions(ctx, { bankAccountId: house.bankAccountId, ...RANGE }),
      bankAdapter().fetchTransactions(ctx, { bankAccountId: house.bankAccountId, ...RANGE }),
    ]);

    expect(again).toStrictEqual(first);
  }, 600_000);
});

describe('a house that pays like a textbook', () => {
  it('owes nothing once its statement has been read', async () => {
    const house = houseAt(0);

    const result = await sync(house);

    expect(result.matchedCount).toBe(UNITS * MONTHS);
    expect(result.unmatched).toStrictEqual([]);
    await expect(listDebtors(ctx, { svjId: house.svjId, minDebt: 1 })).resolves.toStrictEqual([]);
  }, 600_000);
});

/** Two units of the eight pay properly; the profile arranges for the other six not to. */
const MISTYPED = 2;
const JOINT_PAYMENTS = MONTHS / 2;
const SETTLED_UNITS = 2;

describe('the house the residual comes from', () => {
  it('settles only the units that paid their own symbol and their own amount', async () => {
    const result = await sync(houseAt(1));

    expect(result.matchedCount).toBe(SETTLED_UNITS * MONTHS);
    expect(result.unmatched).toHaveLength(MISTYPED * MONTHS + JOINT_PAYMENTS);
  }, 600_000);

  /**
   * Six, not three. Three units sent nothing at all; three sent money the rules could not place —
   * a swapped pair of digits, or two months in one payment — and until somebody decides what that
   * money was for, the ledger cannot tell the two kinds apart. Telling them apart is the agent's
   * job (task 022), and this is the state it is handed.
   */
  it('leaves six units owing a whole year, three of whom did pay', async () => {
    const debtors = await listDebtors(ctx, { svjId: houseAt(1).svjId, minDebt: 1 });

    expect(debtors).toHaveLength(6);
    for (const debtor of debtors) {
      expect(debtor.balance).toBe(-MONTHLY * MONTHS);
    }
  }, 600_000);

  it('reads the same statement twice without adding anything', async () => {
    await expect(sync(houseAt(1))).resolves.toMatchObject({ newCount: 0, matchedCount: 0 });
  }, 600_000);
});

describe('a house where somebody pays short', () => {
  it('settles nothing for that unit and leaves it owing the difference', async () => {
    const house = houseAt(2);

    const result = await sync(house);

    expect(result.unmatched.length).toBeGreaterThan(0);
    expect(result.matchedCount).toBe((UNITS - 1) * MONTHS);
  }, 600_000);
});
