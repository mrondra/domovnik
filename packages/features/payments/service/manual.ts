import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { DomainError } from '../../../kernel/src/errors/index';
import type { BankTransactionId } from '../domain/ids';
import type { MatchTarget } from '../domain/types';
import { applyMatch } from '../matching/apply';
import { candidatesFor } from '../matching/search';
import { getTransaction } from './residual';

export interface ManualMatchInput {
  readonly transactionId: BankTransactionId;
  readonly targetType: MatchTarget;
  readonly targetId: string;
  readonly amount: number;
}

const CERTAIN = 1;

/**
 * A person pairing a movement by hand. It is the same write the rules and the agent make — the
 * only difference is `method: 'manual'` and a confidence of one, because somebody looked.
 *
 * The target still has to be one of the candidates. A person who knows better than the candidate
 * list is telling us the list is wrong, and that is a thing to fix in `matching/`, not to work
 * around one movement at a time (task 023).
 */
export const matchManually = (ctx: RequestContext, input: ManualMatchInput): Promise<void> =>
  withTenant(ctx, async () => {
    const movement = await getTransaction(ctx, input.transactionId);
    const chosen = (await candidatesFor(ctx, movement)).find(
      (one) => one.targetId === input.targetId && one.targetType === input.targetType,
    );

    if (chosen === undefined) {
      throw new DomainError('Tento cíl není mezi kandidáty pohybu', {
        code: 'payment_candidate_unknown',
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
        method: 'manual',
        confidence: CERTAIN,
      },
      chosen.unitId === undefined ? null : { unitId: chosen.unitId },
    );

    await audit.record(ctx, {
      action: 'payment.matched_manually',
      entity: 'bank_transaction',
      entityId: movement.id,
      reason: 'Pohyb spárován ručně',
      after: { targetType: input.targetType, targetId: input.targetId },
    });
  });
