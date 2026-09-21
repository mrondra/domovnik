import type { RequestContext } from '../../../kernel/src/context/index';
import { fetchStatements, recordStatements } from '../../accounting-sync/index';
import { getBankAccount } from '../service/accounts';
import type { BankAdapter, FetchTransactionsInput } from './bank.adapter';
import type { IncomingTransaction } from '../domain/types';
import { syntheticBank } from './synthetic/index';

/**
 * The statement, read out of the accounting (zadání kap. 8: primarily through Pohoda). Pohoda
 * already has the account — the bank tells it about every movement — so asking the bank a second
 * time would only give us two copies of the same statement to reconcile.
 *
 * In the demo nobody tells Pohoda anything, so the generated statement is written into it first
 * and read straight back. That round trip is the point: everything downstream sees movements that
 * came out of the accounting, which is what production will do too.
 */
export const pohodaBank: BankAdapter = {
  kind: 'pohoda',
  fetchTransactions: async (
    ctx: RequestContext,
    input: FetchTransactionsInput,
  ): Promise<readonly IncomingTransaction[]> => {
    const account = await getBankAccount(ctx, input.bankAccountId);
    const generated = await syntheticBank.fetchTransactions(ctx, input);

    await recordStatements(
      ctx,
      account.svjId,
      generated.map((one) => ({
        externalId: one.externalId,
        bookedOn: one.bookedOn,
        amount: one.amount,
        variableSymbol: one.variableSymbol,
        counterpartyAccount: one.counterpartyAccount,
        counterpartyName: one.counterpartyName,
        message: one.message,
      })),
    );

    const lines = await fetchStatements(ctx, {
      svjId: account.svjId,
      from: input.from,
      to: input.to,
    });

    return lines.map((line) => ({
      externalId: line.externalId,
      bookedOn: line.bookedOn,
      amount: line.amount,
      variableSymbol: line.variableSymbol,
      counterpartyAccount: line.counterpartyAccount,
      counterpartyName: line.counterpartyName,
      message: line.message,
    }));
  },
};
