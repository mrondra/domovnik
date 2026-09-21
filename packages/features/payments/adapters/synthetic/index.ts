import type { RequestContext } from '../../../../kernel/src/context/index';
import { readModels } from '../../../svj/index';
import { getBankAccount } from '../../service/accounts';
import type { BankAdapter, FetchTransactionsInput } from '../bank.adapter';
import type { IncomingTransaction } from '../../domain/types';
import { generateStatement } from './generator';
import { profileFor } from './profile';

/**
 * The demo bank. It answers what the house's own prescriptions and posted invoices say should have
 * moved, bent by the profile of that house — so the statement is not made up, it is derived, and
 * everything the matching rules then do to it is the real thing (task 021).
 */
export const syntheticBank: BankAdapter = {
  kind: 'synthetic',
  fetchTransactions: async (
    ctx: RequestContext,
    input: FetchTransactionsInput,
  ): Promise<readonly IncomingTransaction[]> => {
    const account = await getBankAccount(ctx, input.bankAccountId);
    const sequence = await readModels.svjSequence(ctx, account.svjId);

    return generateStatement(ctx, account.svjId, profileFor(sequence), {
      from: input.from,
      to: input.to,
    });
  },
};
