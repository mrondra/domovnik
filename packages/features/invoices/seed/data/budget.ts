import type { BudgetCategory } from '../../domain/types';

export interface DemoBudgetLine {
  readonly category: BudgetCategory;
  readonly plannedAmount: number;
  /**
   * How much of the line is already gone, as a fraction. The seed realises it as invoices that were
   * really approved, so the remainder the checks compute is the remainder a person would compute.
   */
  readonly spentRatio?: number | undefined;
}

const line = (category: BudgetCategory, plannedAmount: number): DemoBudgetLine => ({
  category,
  plannedAmount,
});

/** The current year's plan for each of the three demo SVJ, in the order the `svj` seed writes them. */
export const DEMO_BUDGETS: readonly (readonly DemoBudgetLine[])[] = [
  [
    line('uklid', 102_000),
    line('vytah', 38_400),
    line('energie', 50_400),
    line('pojisteni', 31_200),
    line('opravy', 120_000),
    line('revize', 25_000),
  ],
  [
    line('uklid', 288_000),
    line('vytah', 117_600),
    line('energie', 426_000),
    line('pojisteni', 76_800),
    line('opravy', 450_000),
    line('revize', 90_000),
  ],
  [
    line('uklid', 168_000),
    line('vytah', 62_400),
    line('energie', 87_600),
    line('pojisteni', 49_200),
    // The roofing job is what the year went on; the scenario invoice then does not fit.
    { category: 'opravy', plannedAmount: 600_000, spentRatio: 0.9 },
    line('revize', 60_000),
  ],
];
