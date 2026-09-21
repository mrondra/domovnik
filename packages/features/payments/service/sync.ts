import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { bankAdapterFor } from '../adapters/index';
import type { BankAccountId } from '../domain/ids';
import type { ImportResult, IsoDay } from '../domain/types';
import { getBankAccount } from './accounts';
import { importTransactions } from './import';

export interface SyncBankAccountInput {
  readonly bankAccountId: BankAccountId;
  readonly from: IsoDay;
  readonly to: IsoDay;
}

/**
 * Fetching a statement and importing it are one action from the outside and two inside: where the
 * movements came from is the adapter's business, and what they turn out to be about is the rules'.
 * Everything downstream is the same whichever bank answered (task 021).
 */
export const syncBankAccount = (ctx: RequestContext, input: SyncBankAccountInput): Promise<ImportResult> =>
  withTenant(ctx, async () => {
    const account = await getBankAccount(ctx, input.bankAccountId);
    const adapter = await bankAdapterFor(ctx, account.svjId);
    const transactions = await adapter.fetchTransactions(ctx, input);

    return importTransactions(ctx, {
      svjId: account.svjId,
      bankAccountId: account.id,
      transactions,
    });
  });
