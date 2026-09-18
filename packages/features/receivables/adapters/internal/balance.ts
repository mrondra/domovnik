import { and, asc, eq, lte, sum } from 'drizzle-orm';
import type { RequestContext } from '../../../../kernel/src/context/index';
import { withTenant } from '../../../../kernel/src/db/index';
import { unitIdSchema, type UnitId } from '../../../svj/index';
import type { Period } from '../../domain/period';
import type { BalanceEntry, UnitBalance } from '../../domain/types';
import { prescription, unitBalanceEntry } from '../../schema';
import type { ListDebtorsInput, UnitBalanceInput } from '../receivables.adapter';
import { toBalanceEntry } from './rows';

const entriesOf = (ctx: RequestContext, input: UnitBalanceInput): Promise<readonly BalanceEntry[]> =>
  withTenant(ctx, async (tx) => {
    const ofUnit = and(eq(unitBalanceEntry.svjId, input.svjId), eq(unitBalanceEntry.unitId, input.unitId));
    const rows = await tx
      .select()
      .from(unitBalanceEntry)
      .where(input.asOf === undefined ? ofUnit : and(ofUnit, lte(unitBalanceEntry.entryDate, input.asOf)))
      .orderBy(asc(unitBalanceEntry.entryDate));

    return rows.map(toBalanceEntry);
  });

/**
 * The oldest month the payments received so far do not cover. Credit is applied to the prescriptions
 * in the order they were raised, which is how a tenant reads a statement: the debt is the old month,
 * not the new one.
 */
const oldestUnpaid = async (
  ctx: RequestContext,
  input: UnitBalanceInput,
  entries: readonly BalanceEntry[],
): Promise<Period | undefined> => {
  let credit = entries
    .filter((entry) => entry.kind !== 'prescription')
    .reduce((total, entry) => total + entry.amount, 0);

  const raised = await withTenant(ctx, (tx) =>
    tx
      .select({ year: prescription.year, month: prescription.month, total: prescription.totalAmount })
      .from(prescription)
      .where(and(eq(prescription.svjId, input.svjId), eq(prescription.unitId, input.unitId)))
      .orderBy(asc(prescription.year), asc(prescription.month)),
  );

  for (const row of raised) {
    const owed = Number(row.total);
    if (credit < owed) return { year: row.year, month: row.month };
    credit -= owed;
  }
  return undefined;
};

export const unitBalance = async (ctx: RequestContext, input: UnitBalanceInput): Promise<UnitBalance> => {
  const entries = await entriesOf(ctx, input);

  return {
    unitId: input.unitId,
    balance: entries.reduce((total, entry) => total + entry.amount, 0),
    oldestUnpaidPeriod: await oldestUnpaid(ctx, input, entries),
    entries,
  };
};

/** Owing money is a negative balance, so a debtor is a unit whose balance is at most `-minDebt`. */
const owingUnits = (ctx: RequestContext, input: ListDebtorsInput): Promise<readonly UnitId[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ unitId: unitBalanceEntry.unitId, total: sum(unitBalanceEntry.amount) })
      .from(unitBalanceEntry)
      .where(eq(unitBalanceEntry.svjId, input.svjId))
      .groupBy(unitBalanceEntry.unitId);

    return rows
      .filter((row) => -Number(row.total ?? 0) >= input.minDebt)
      .map((row) => unitIdSchema.parse(row.unitId));
  });

export const listDebtors = async (
  ctx: RequestContext,
  input: ListDebtorsInput,
): Promise<readonly UnitBalance[]> => {
  const units = await owingUnits(ctx, input);
  const balances: UnitBalance[] = [];
  for (const unitId of units) {
    balances.push(await unitBalance(ctx, { svjId: input.svjId, unitId }));
  }
  return balances.sort((left, right) => left.balance - right.balance);
};
