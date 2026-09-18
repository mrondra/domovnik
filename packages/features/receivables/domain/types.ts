import type { SvjId } from '../../../kernel/src/ids/index';
import type { UnitId, UnitKind } from '../../svj/index';
import type { BalanceEntryId, PrescriptionId, PrescriptionItemId } from './ids';
import type { IsoDay, Period } from './period';

export type PrescriptionSource = 'internal' | 'pohoda';

export type BalanceEntryKind = 'prescription' | 'payment' | 'adjustment';

/** What the entry was raised for, in the words of the feature that raised it — never a foreign key. */
export interface EntryReference {
  readonly type: string;
  readonly id: string;
}

export interface PrescriptionItem {
  readonly id: PrescriptionItemId;
  readonly code: string;
  readonly label: string;
  readonly amount: number;
}

export interface Prescription {
  readonly id: PrescriptionId;
  readonly svjId: SvjId;
  readonly unitId: UnitId;
  readonly period: Period;
  readonly variableSymbol: string;
  readonly totalAmount: number;
  readonly dueDate: IsoDay;
  readonly source: PrescriptionSource;
  readonly items: readonly PrescriptionItem[];
}

export interface BalanceEntry {
  readonly id: BalanceEntryId;
  readonly unitId: UnitId;
  readonly entryDate: IsoDay;
  readonly kind: BalanceEntryKind;
  /** A prescription is negative, a payment positive; the sum of these is the balance. */
  readonly amount: number;
  readonly reference: EntryReference | null;
}

export interface UnitBalance {
  readonly unitId: UnitId;
  readonly balance: number;
  readonly oldestUnpaidPeriod?: Period | undefined;
  readonly entries: readonly BalanceEntry[];
}

/** `per_square_metre` multiplies the floor area of the unit; `per_unit` is the same for every one. */
export type PlanBasis = 'per_square_metre' | 'per_unit';

export interface PrescriptionPlanItem {
  readonly code: string;
  readonly label: string;
  readonly basis: PlanBasis;
  readonly rate: number;
  /** A `per_unit` rate a given kind of unit pays instead of `rate` — a garage is not a flat. */
  readonly rateByKind?: Partial<Record<UnitKind, number>> | undefined;
}

export interface PrescriptionPlan {
  readonly items: readonly PrescriptionPlanItem[];
  readonly dueDayOfMonth: number;
}
