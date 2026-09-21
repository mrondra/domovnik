import { desc, eq } from 'drizzle-orm';
import { approvals } from '../../../kernel/src/approvals/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { approvalIdSchema } from '../../../kernel/src/ids/index';
import type { BankTransactionId } from '../domain/ids';
import { proposeMatchSchema } from '../domain/proposal';
import type { BankTransaction, MatchMethod, MatchTarget } from '../domain/types';
import type { Candidate } from '../matching/candidate';
import { candidatesFor } from '../matching/search';
import { paymentMatch } from '../schema';
import { getTransaction } from './residual';

export interface AppliedMatch {
  readonly targetType: MatchTarget;
  readonly targetId: string;
  readonly amount: number;
  readonly method: MatchMethod;
  readonly confidence: number;
}

export interface ProposalView {
  readonly id: string;
  readonly status: string;
  readonly targetType: MatchTarget;
  readonly targetId: string;
  readonly amount: number;
  readonly reason: string;
}

export interface TransactionDetail {
  readonly transaction: BankTransaction;
  readonly match: AppliedMatch | null;
  readonly proposal: ProposalView | null;
  /** Recomputed on every read, because the data they are derived from moves (task 022). */
  readonly candidates: readonly Candidate[];
}

const appliedMatch = (ctx: RequestContext, transactionId: BankTransactionId): Promise<AppliedMatch | null> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(paymentMatch)
      .where(eq(paymentMatch.transactionId, transactionId))
      .orderBy(desc(paymentMatch.createdAt))
      .limit(1);

    const row = rows[0];
    return row === undefined
      ? null
      : {
          targetType: row.targetType,
          targetId: row.targetId,
          amount: Number(row.amount),
          method: row.method,
          confidence: Number(row.confidence),
        };
  });

/** What the agent proposed about this movement and has not been decided about yet. */
const pendingProposal = async (
  ctx: RequestContext,
  transactionId: BankTransactionId,
): Promise<ProposalView | null> => {
  const pending = await approvals.list(ctx, { status: 'pending' });

  for (const summary of pending.filter((one) => one.toolName === 'payment.proposeMatch')) {
    const detail = await approvals.get(ctx, approvalIdSchema.parse(summary.id));
    const input = proposeMatchSchema.safeParse(detail.input);
    if (input.success && input.data.transactionId === transactionId) {
      return { id: detail.id, status: detail.status, ...input.data };
    }
  }
  return null;
};

/**
 * One movement with everything there is to say about it: what it was paired with, what is being
 * proposed, and what it could still be about. The candidates are computed fresh on every read —
 * they are derived from prescriptions and invoices, and those move (task 023).
 */
export const transactionDetail = async (
  ctx: RequestContext,
  transactionId: BankTransactionId,
): Promise<TransactionDetail> => {
  const transaction = await getTransaction(ctx, transactionId);

  return {
    transaction,
    match: await appliedMatch(ctx, transactionId),
    proposal: await pendingProposal(ctx, transactionId),
    candidates: await candidatesFor(ctx, transaction),
  };
};
