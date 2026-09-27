import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { setBudgetLine } from '../service/index';
import { DEMO_BUDGETS } from './data/budget';

/** Idempotent by `(tenant, svj, year, category)`; a second plan for a line is a correction. */
export const seedBudget = async (
  ctx: RequestContext,
  svjId: SvjId,
  house: number,
  year: number,
): Promise<void> => {
  for (const demo of DEMO_BUDGETS[house] ?? []) {
    await setBudgetLine(ctx, {
      svjId,
      year,
      category: demo.category,
      plannedAmount: demo.plannedAmount,
    });
  }
};
