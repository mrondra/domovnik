import { audit } from '../../../kernel/src/audit/index';
import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { events } from '../../../kernel/src/events/index';
import { newId, type SvjId } from '../../../kernel/src/ids/index';
import { transactionsImported, transactionsUnmatched } from '../domain/events';
import { bankTransactionIdSchema, type BankAccountId } from '../domain/ids';
import type { BankTransaction, ImportResult, IncomingTransaction } from '../domain/types';
import { matchAll } from '../matching/index';
import { bankTransaction } from '../schema';
import { assertReachable } from './reach';
import { asMoney, toTransaction } from './rows';

export interface ImportTransactionsInput {
  readonly svjId: SvjId;
  readonly bankAccountId: BankAccountId;
  readonly transactions: readonly IncomingTransaction[];
}

const asRow = (ctx: RequestContext, input: ImportTransactionsInput, one: IncomingTransaction) => ({
  id: newId(bankTransactionIdSchema),
  tenantId: ctx.tenantId,
  svjId: input.svjId,
  createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
  bankAccountId: input.bankAccountId,
  externalId: one.externalId,
  bookedOn: one.bookedOn,
  amount: asMoney(one.amount),
  counterpartyAccount: one.counterpartyAccount ?? null,
  counterpartyName: one.counterpartyName ?? null,
  variableSymbol: one.variableSymbol ?? null,
  specificSymbol: one.specificSymbol ?? null,
  message: one.message ?? null,
  matchStatus: 'unmatched' as const,
});

/**
 * The bank's own id for a movement is what makes importing the same statement twice add nothing.
 * `returning()` after `onConflictDoNothing` answers only the rows that were really written, so the
 * matching pass below runs over exactly the new ones (task 020).
 */
const insertNew = async (
  ctx: RequestContext,
  input: ImportTransactionsInput,
): Promise<readonly BankTransaction[]> => {
  if (input.transactions.length === 0) return [];

  const rows = await withTenant(ctx, (tx) =>
    tx
      .insert(bankTransaction)
      .values(input.transactions.map((one) => asRow(ctx, input, one)))
      .onConflictDoNothing()
      .returning(),
  );

  return rows.map(toTransaction);
};

/**
 * A statement in, and everything the rules can settle settled. What is left leaves as **one**
 * event for the whole batch: an agent is woken once and given two hundred movements, not woken
 * two hundred times (ADR 0004, zadání kap. 7).
 */
export const importTransactions = (
  ctx: RequestContext,
  input: ImportTransactionsInput,
): Promise<ImportResult> =>
  withTenant(ctx, async () => {
    await assertReachable(ctx, input.svjId);

    const fresh = await insertNew(ctx, input);
    const onSvj = withSvj(ctx, input.svjId);

    await events.emit(
      onSvj,
      transactionsImported.create({
        svjId: input.svjId,
        bankAccountId: input.bankAccountId,
        count: input.transactions.length,
        newCount: fresh.length,
      }),
    );

    await audit.record(ctx, {
      action: 'finance.transactions.imported',
      entity: 'bank_account',
      entityId: input.bankAccountId,
      reason: `Import ${String(input.transactions.length)} pohybů`,
      after: { count: input.transactions.length, newCount: fresh.length },
    });

    const { matched, residual } = await matchAll(ctx, fresh);

    if (residual.length > 0) {
      await events.emit(
        onSvj,
        transactionsUnmatched.create({
          svjId: input.svjId,
          transactionIds: residual.map((one) => one.id),
        }),
      );
    }

    return {
      count: input.transactions.length,
      newCount: fresh.length,
      matchedCount: matched.length,
      unmatched: residual.map((one) => one.id),
    };
  });
