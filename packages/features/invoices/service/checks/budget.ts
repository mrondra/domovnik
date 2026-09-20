import type { RequestContext } from '../../../../kernel/src/context/index';
import type { SvjId } from '../../../../kernel/src/ids/index';
import type { Check } from '../../domain/checks';
import type { BudgetCategory } from '../../domain/types';
import { budgetStatus } from '../budget';
import type { ExtractedInvoice } from '../extraction/schema';

/**
 * What is left of the line this invoice would be booked against. It is a warning and not a refusal:
 * a budget is a plan, and the year it is exceeded in is exactly the year the committee needs to be
 * told rather than stopped.
 */
export const budgetCheck = async (
  ctx: RequestContext,
  svjId: SvjId,
  category: BudgetCategory | null,
  extracted: ExtractedInvoice,
): Promise<Check | null> => {
  if (category === null) return null;

  const year = Number(extracted.issuedOn.slice(0, 4));
  if (!Number.isInteger(year)) return null;

  const status = await budgetStatus(ctx, { svjId, year, category });
  if (status.remaining >= extracted.amountTotal) return null;

  return {
    code: 'budget_exceeded',
    severity: 'warning',
    message: `Rozpočet ${category} na rok ${String(year)} nestačí: zbývá ${String(status.remaining)} Kč.`,
    data: { category, year, remaining: status.remaining, invoiced: extracted.amountTotal },
  };
};
