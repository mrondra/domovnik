import type { UnitKind } from '../../svj/index';
import type { PrescriptionPlan, PrescriptionPlanItem } from './types';

export interface PlannedItem {
  readonly code: string;
  readonly label: string;
  readonly amount: number;
}

export interface PlannedPrescription {
  readonly items: readonly PlannedItem[];
  readonly total: number;
}

/** What the rates are applied to: a flat, a shop and a garage do not pay the same. */
export interface PlanSubject {
  readonly floorArea: number;
  readonly kind: UnitKind;
}

const CENTS = 100;

/** Crowns and hallers; a rate per square metre rarely divides into whole crowns. */
const toWholeHallers = (value: number): number => Math.round(value * CENTS) / CENTS;

const perUnitRate = (item: PrescriptionPlanItem, kind: UnitKind): number =>
  item.rateByKind?.[kind] ?? item.rate;

const amountOf = (item: PrescriptionPlanItem, subject: PlanSubject): number =>
  toWholeHallers(
    item.basis === 'per_square_metre' ? item.rate * subject.floorArea : perUnitRate(item, subject.kind),
  );

/**
 * What one unit pays each month, and what it is made of. The total is the sum of the rounded items,
 * never the rounded sum: the payer adds up the lines on the prescription and has to get the total.
 */
export const applyPlan = (plan: PrescriptionPlan, subject: PlanSubject): PlannedPrescription => {
  const items = plan.items.map((item) => ({
    code: item.code,
    label: item.label,
    amount: amountOf(item, subject),
  }));

  return { items, total: toWholeHallers(items.reduce((sum, item) => sum + item.amount, 0)) };
};
