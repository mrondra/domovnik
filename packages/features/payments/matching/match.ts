import type { RequestContext } from '../../../kernel/src/context/index';
import type { BankTransaction } from '../domain/types';
import { applyMatch } from './apply';
import { invoiceFor, prescriptionFor } from './candidates';
import { decideExpense, decideIncome, isIncome } from './rules';

export interface MatchOutcome {
  readonly matched: readonly BankTransaction[];
  readonly residual: readonly BankTransaction[];
}

const matchIncome = async (ctx: RequestContext, movement: BankTransaction): Promise<boolean> => {
  const candidate = await prescriptionFor(ctx, movement.svjId, movement.variableSymbol);
  const decision = decideIncome(movement.amount, candidate);
  if (decision.kind !== 'matched' || candidate === null) return false;

  await applyMatch(ctx, movement, decision, { unitId: candidate.unitId });
  return true;
};

const matchExpense = async (ctx: RequestContext, movement: BankTransaction): Promise<boolean> => {
  const decision = decideExpense(
    movement.amount,
    await invoiceFor(ctx, movement.svjId, movement.variableSymbol),
  );
  if (decision.kind !== 'matched') return false;

  await applyMatch(ctx, movement, decision, null);
  return true;
};

/**
 * Everything the rules can settle without asking anyone. What survives is the residual, and the
 * residual is what the agent is woken for — once, with the batch (ADR 0004, zadání kap. 7).
 */
export const matchAll = async (
  ctx: RequestContext,
  movements: readonly BankTransaction[],
): Promise<MatchOutcome> => {
  const matched: BankTransaction[] = [];
  const residual: BankTransaction[] = [];

  for (const movement of movements) {
    const settled = isIncome(movement.amount)
      ? await matchIncome(ctx, movement)
      : await matchExpense(ctx, movement);

    (settled ? matched : residual).push(movement);
  }

  return { matched, residual };
};
