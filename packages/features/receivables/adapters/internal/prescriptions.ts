import { and, asc, eq, inArray } from 'drizzle-orm';
import type { RequestContext } from '../../../../kernel/src/context/index';
import { withTenant } from '../../../../kernel/src/db/index';
import type { SvjId } from '../../../../kernel/src/ids/index';
import type { Period } from '../../domain/period';
import type { Prescription, PrescriptionItem } from '../../domain/types';
import { prescription, prescriptionItem } from '../../schema';
import type { FindByVariableSymbolInput, ListPrescriptionsInput } from '../receivables.adapter';
import { toPrescription, toPrescriptionItem, type PrescriptionRow } from './rows';

const inPeriod = (svjId: SvjId, period: Period) =>
  and(
    eq(prescription.svjId, svjId),
    eq(prescription.year, period.year),
    eq(prescription.month, period.month),
  );

/** One query for every prescription in the answer, so a month of 80 units is two round trips. */
const itemsByPrescription = async (
  ctx: RequestContext,
  ids: readonly string[],
): Promise<ReadonlyMap<string, PrescriptionItem[]>> => {
  const grouped = new Map<string, PrescriptionItem[]>();
  if (ids.length === 0) return grouped;

  const rows = await withTenant(ctx, (tx) =>
    tx
      .select()
      .from(prescriptionItem)
      .where(inArray(prescriptionItem.prescriptionId, [...ids]))
      .orderBy(asc(prescriptionItem.code)),
  );

  for (const row of rows) {
    const existing = grouped.get(row.prescriptionId) ?? [];
    existing.push(toPrescriptionItem(row));
    grouped.set(row.prescriptionId, existing);
  }
  return grouped;
};

export const withItems = async (
  ctx: RequestContext,
  rows: readonly PrescriptionRow[],
): Promise<readonly Prescription[]> => {
  const items = await itemsByPrescription(
    ctx,
    rows.map((row) => row.id),
  );
  return rows.map((row) => toPrescription(row, items.get(row.id) ?? []));
};

export const listPrescriptions = (
  ctx: RequestContext,
  input: ListPrescriptionsInput,
): Promise<readonly Prescription[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(prescription)
      .where(inPeriod(input.svjId, input.period))
      .orderBy(asc(prescription.variableSymbol));

    return withItems(ctx, rows);
  });

/**
 * What a bank transfer is matched against: the symbol alone in the general case, narrowed to one
 * month when the payment says which one it is for (task 020).
 */
export const findByVariableSymbol = (
  ctx: RequestContext,
  input: FindByVariableSymbolInput,
): Promise<Prescription | null> =>
  withTenant(ctx, async (tx) => {
    const symbol = and(
      eq(prescription.svjId, input.svjId),
      eq(prescription.variableSymbol, input.variableSymbol),
    );
    const rows = await tx
      .select()
      .from(prescription)
      .where(input.period === undefined ? symbol : and(symbol, inPeriod(input.svjId, input.period)))
      .orderBy(asc(prescription.year), asc(prescription.month))
      .limit(1);

    const found = await withItems(ctx, rows);
    return found[0] ?? null;
  });
