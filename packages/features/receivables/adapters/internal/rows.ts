import { svjIdSchema } from '../../../../kernel/src/ids/index';
import { unitIdSchema } from '../../../svj/index';
import { balanceEntryIdSchema, prescriptionIdSchema, prescriptionItemIdSchema } from '../../domain/ids';
import { balanceEntryKindSchema, prescriptionSourceSchema } from '../../domain/schemas';
import type { BalanceEntry, EntryReference, Prescription, PrescriptionItem } from '../../domain/types';

export interface PrescriptionRow {
  readonly id: string;
  readonly svjId: string;
  readonly unitId: string;
  readonly year: number;
  readonly month: number;
  readonly variableSymbol: string;
  readonly totalAmount: string;
  readonly dueDate: string;
  readonly source: string;
}

export interface PrescriptionItemRow {
  readonly id: string;
  readonly prescriptionId: string;
  readonly code: string;
  readonly label: string;
  readonly amount: string;
}

export interface BalanceEntryRow {
  readonly id: string;
  readonly unitId: string;
  readonly entryDate: string;
  readonly kind: string;
  readonly amount: string;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
}

/** Drizzle returns `numeric` as a string, so the column decides the precision, not a float. */
export const asMoney = (value: number): string => value.toFixed(2);

/** And a `date` as `YYYY-MM-DD`, which is a day without a time zone and has to stay one. */
export const asDay = (value: Date): string => value.toISOString().slice(0, 10);

const dayOf = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

export const toPrescription = (row: PrescriptionRow, items: readonly PrescriptionItem[]): Prescription => ({
  id: prescriptionIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  unitId: unitIdSchema.parse(row.unitId),
  period: { year: row.year, month: row.month },
  variableSymbol: row.variableSymbol,
  totalAmount: Number(row.totalAmount),
  dueDate: dayOf(row.dueDate),
  source: prescriptionSourceSchema.parse(row.source),
  items,
});

export const toPrescriptionItem = (row: PrescriptionItemRow): PrescriptionItem => ({
  id: prescriptionItemIdSchema.parse(row.id),
  code: row.code,
  label: row.label,
  amount: Number(row.amount),
});

const referenceOf = (row: BalanceEntryRow): EntryReference | null =>
  row.referenceType === null || row.referenceId === null
    ? null
    : { type: row.referenceType, id: row.referenceId };

export const toBalanceEntry = (row: BalanceEntryRow): BalanceEntry => ({
  id: balanceEntryIdSchema.parse(row.id),
  unitId: unitIdSchema.parse(row.unitId),
  entryDate: dayOf(row.entryDate),
  kind: balanceEntryKindSchema.parse(row.kind),
  amount: Number(row.amount),
  reference: referenceOf(row),
});
