import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { BankAccountId } from '../domain/ids';
import type { BankAccount, BankTransaction, ImportResult } from '../domain/types';
import { createBankAccount, getBankAccount, listBankAccounts, type CreateBankAccountInput } from './accounts';
import { importTransactions, type ImportTransactionsInput } from './import';
import { listTransactions } from './transactions';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a tool or an agent can call the same function without going through Nest.
 */
@Injectable()
export class PaymentsService {
  createBankAccount(ctx: RequestContext, input: CreateBankAccountInput): Promise<BankAccount> {
    return createBankAccount(ctx, input);
  }

  listBankAccounts(ctx: RequestContext, svjId: SvjId): Promise<readonly BankAccount[]> {
    return listBankAccounts(ctx, svjId);
  }

  getBankAccount(ctx: RequestContext, bankAccountId: BankAccountId): Promise<BankAccount> {
    return getBankAccount(ctx, bankAccountId);
  }

  importTransactions(ctx: RequestContext, input: ImportTransactionsInput): Promise<ImportResult> {
    return importTransactions(ctx, input);
  }

  listTransactions(
    ctx: RequestContext,
    svjId: SvjId,
    ids: readonly string[],
  ): Promise<readonly BankTransaction[]> {
    return listTransactions(ctx, svjId, ids);
  }
}
