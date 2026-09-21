import { and, eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { BankTransactionId } from '../domain/ids';
import type { BankTransaction, MatchStatus } from '../domain/types';
import { bankTransaction } from '../schema';
import { assertReachable } from './reach';
import { toTransaction } from './rows';

/** The movements no rule could settle; it is what the agent is woken with (task 022). */
export const listUnmatched = (ctx: RequestContext, svjId: SvjId): Promise<readonly BankTransaction[]> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, svjId);

    const rows = await tx
      .select()
      .from(bankTransaction)
      .where(and(eq(bankTransaction.svjId, svjId), eq(bankTransaction.matchStatus, 'unmatched')));

    return rows.map(toTransaction);
  });

export const getTransaction = (
  ctx: RequestContext,
  transactionId: BankTransactionId,
): Promise<BankTransaction> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(bankTransaction)
      .where(eq(bankTransaction.id, transactionId))
      .limit(1);

    const row = rows[0];
    if (row === undefined) {
      throw new NotFoundError('Bankovní pohyb nenalezen', {
        code: 'bank_transaction_not_found',
        details: { transactionId },
      });
    }

    const found = toTransaction(row);
    await assertReachable(ctx, found.svjId);
    return found;
  });

/**
 * Where a movement stands while somebody decides about it. `proposed` is the agent waiting on a
 * person; `ignored` is a bank charge or a transfer between our own accounts — not a mistake, just
 * nothing to pair it with.
 */
export const setMatchStatus = (
  ctx: RequestContext,
  transactionId: BankTransactionId,
  status: MatchStatus,
  reason: string,
): Promise<void> =>
  withTenant(ctx, async (tx) => {
    const movement = await getTransaction(ctx, transactionId);

    await tx
      .update(bankTransaction)
      .set({ matchStatus: status, updatedAt: new Date() })
      .where(eq(bankTransaction.id, transactionId));

    await audit.record(ctx, {
      action: `payment.${status}`,
      entity: 'bank_transaction',
      entityId: movement.id,
      reason,
      before: { matchStatus: movement.matchStatus },
      after: { matchStatus: status },
    });
  });
