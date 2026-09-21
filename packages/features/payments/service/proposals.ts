import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError } from '../../../kernel/src/errors/index';
import { usersWithRole } from '../../../kernel/src/identity/index';
import { applyMatch } from '../matching/apply';
import { candidatesFor } from '../matching/search';
import type { BankTransactionId } from '../domain/ids';
import type { MatchTarget } from '../domain/types';
import { getTransaction, setMatchStatus } from './residual';

export interface ProposeMatchInput {
  readonly transactionId: BankTransactionId;
  readonly targetType: MatchTarget;
  readonly targetId: string;
  readonly amount: number;
  readonly reason: string;
}

const DAYS_TO_DECIDE = 7;
const DAY = 24 * 60 * 60 * 1000;
const AGENT_CONFIDENCE = 0.8;

/** Money is the accountants' to decide about, whichever SVJ it arrived in (zadání kap. 9). */
export const financeApprovers = (ctx: RequestContext): Promise<readonly string[]> =>
  usersWithRole(ctx, 'finance');

export const decideBy = (now: Date = new Date()): Date => new Date(now.getTime() + DAYS_TO_DECIDE * DAY);

/** The movement is now waiting on somebody, and says so to everyone else looking at the list. */
export const markProposed = (ctx: RequestContext, transactionId: BankTransactionId): Promise<void> =>
  setMatchStatus(ctx, transactionId, 'proposed', 'Návrh párování předán financím');

/**
 * Carries out what the accountants approved. The target is checked against the candidates once
 * more: the list is computed from the data, the data may have moved between the proposal and the
 * decision, and a target that is no longer on it is no longer a match anybody worked out.
 */
export const applyProposal = async (ctx: RequestContext, input: ProposeMatchInput): Promise<void> => {
  const movement = await getTransaction(ctx, input.transactionId);
  const chosen = (await candidatesFor(ctx, movement)).find(
    (one) => one.targetId === input.targetId && one.targetType === input.targetType,
  );

  if (chosen === undefined) {
    throw new DomainError('Navržený cíl už mezi kandidáty není', {
      code: 'payment_candidate_gone',
      details: { transactionId: input.transactionId, targetId: input.targetId },
    });
  }

  await applyMatch(
    ctx,
    movement,
    {
      kind: 'matched',
      targetType: input.targetType,
      targetId: input.targetId,
      amount: input.amount,
      method: 'agent',
      confidence: AGENT_CONFIDENCE,
    },
    chosen.unitId === undefined ? null : { unitId: chosen.unitId },
  );
};
