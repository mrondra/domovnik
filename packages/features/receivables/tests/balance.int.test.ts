import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { schema, withTenant } from '../../../kernel/src/db/index';
import { DomainError } from '../../../kernel/src/errors/index';
import type { Period } from '../domain/period';
import {
  findByVariableSymbol,
  generatePrescriptions,
  listDebtors,
  recordPayment,
  unitBalance,
} from '../service/index';
import {
  DEMO_PLAN,
  seedHouse,
  startReceivablesDb,
  withTestTenant,
  type Seeded,
  type TestDatabase,
} from './receivables.fixture';

const PERIOD: Period = { year: 2026, month: 9 };
const PAID_ON = '2026-09-10';

let database: TestDatabase;
let ctx: RequestContext;
let house: Seeded;

beforeAll(async () => {
  database = await startReceivablesDb();
  ctx = (await withTestTenant()).ctx;
  house = await seedHouse(ctx, 3);
  await generatePrescriptions(ctx, { svjId: house.svjId, period: PERIOD, plan: DEMO_PLAN });
}, 180_000);

afterAll(async () => {
  await database.stop();
});

const unitAt = (index: number): Seeded['units'][number] => {
  const unit = house.units[index];
  if (unit === undefined)
    throw new DomainError('Fixture nemá tolik jednotek', { code: 'fixture_unit_missing' });
  return unit;
};

const pay = (index: number, amount: number, reference: string): Promise<void> =>
  recordPayment(ctx, {
    svjId: house.svjId,
    unitId: unitAt(index).id,
    amount,
    paidOn: PAID_ON,
    reference: { type: 'bank_transaction', id: reference },
  });

const auditActions = (entityId: string): Promise<readonly string[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ action: schema.auditLog.action })
      .from(schema.auditLog)
      .where(eq(schema.auditLog.entityId, entityId));
    return rows.map((row) => row.action);
  });

describe('the ledger of one unit', () => {
  it('owes the prescription until it is paid, and then nothing', async () => {
    const owing = await unitBalance(ctx, { svjId: house.svjId, unitId: unitAt(0).id });
    expect(owing.balance).toBe(-3300);
    expect(owing.oldestUnpaidPeriod).toStrictEqual(PERIOD);

    await pay(0, 3300, '11111111-1111-7111-8111-111111111111');

    const settled = await unitBalance(ctx, { svjId: house.svjId, unitId: unitAt(0).id });
    expect(settled.balance).toBe(0);
    expect(settled.oldestUnpaidPeriod).toBeUndefined();
    expect(settled.entries).toHaveLength(2);
  });

  it('records the payment in the audit log', async () => {
    const reference = '22222222-2222-7222-8222-222222222222';
    await pay(1, 1000, reference);

    await expect(auditActions(reference)).resolves.toStrictEqual(['finance.payment.recorded']);
  });
});

describe('listDebtors', () => {
  it('names only the units that still owe something', async () => {
    const debtors = await listDebtors(ctx, { svjId: house.svjId, minDebt: 1 });
    const owing = debtors.map((one) => one.unitId);

    expect(owing).toContain(unitAt(2).id);
    expect(owing).not.toContain(unitAt(0).id);
  });
});

describe('findByVariableSymbol', () => {
  it('finds the prescription a payer would quote', async () => {
    const symbol = '010001';

    await expect(
      findByVariableSymbol(ctx, { svjId: house.svjId, variableSymbol: symbol }),
    ).resolves.toMatchObject({ variableSymbol: symbol, unitId: unitAt(0).id });
  });

  it('answers null for a symbol nobody was given', async () => {
    await expect(
      findByVariableSymbol(ctx, { svjId: house.svjId, variableSymbol: '999999' }),
    ).resolves.toBeNull();
  });
});
