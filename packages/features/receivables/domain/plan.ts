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

const CENTS = 100;

/** Crowns and hallers; a rate per square metre rarely divides into whole crowns. */
const toWholeHallers = (value: number): number => Math.round(value * CENTS) / CENTS;

const amountOf = (item: PrescriptionPlanItem, floorArea: number): number =>
  item.basis === 'per_square_metre' ? toWholeHallers(item.rate * floorArea) : toWholeHallers(item.rate);

/**
 * What one unit pays each month, and what it is made of. The total is the sum of the rounded items,
 * never the rounded sum: the payer adds up the lines on the prescription and has to get the total.
 */
export const applyPlan = (plan: PrescriptionPlan, floorArea: number): PlannedPrescription => {
  const items = plan.items.map((item) => ({
    code: item.code,
    label: item.label,
    amount: amountOf(item, floorArea),
  }));

  return { items, total: toWholeHallers(items.reduce((sum, item) => sum + item.amount, 0)) };
};
