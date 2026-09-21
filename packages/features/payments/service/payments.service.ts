import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { BankAccountId, BankTransactionId } from '../domain/ids';
import type { BankAccount, BankTransaction, ImportResult } from '../domain/types';
import { createBankAccount, getBankAccount, listBankAccounts, type CreateBankAccountInput } from './accounts';
import { importTransactions, type ImportTransactionsInput } from './import';
import { browseTransactions, type BrowseTransactionsInput } from './browse';
import { transactionDetail, type TransactionDetail } from './detail';
import { matchManually, type ManualMatchInput } from './manual';
import { setMatchStatus } from './residual';
import { syncBankAccount, type SyncBankAccountInput } from './sync';
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

  syncBankAccount(ctx: RequestContext, input: SyncBankAccountInput): Promise<ImportResult> {
    return syncBankAccount(ctx, input);
  }

  browseTransactions(
    ctx: RequestContext,
    input: BrowseTransactionsInput,
  ): Promise<readonly BankTransaction[]> {
    return browseTransactions(ctx, input);
  }

  transactionDetail(ctx: RequestContext, transactionId: BankTransactionId): Promise<TransactionDetail> {
    return transactionDetail(ctx, transactionId);
  }

  matchManually(ctx: RequestContext, input: ManualMatchInput): Promise<void> {
    return matchManually(ctx, input);
  }

  setMatchStatus(
    ctx: RequestContext,
    transactionId: BankTransactionId,
    status: Parameters<typeof setMatchStatus>[2],
    reason: string,
  ): Promise<void> {
    return setMatchStatus(ctx, transactionId, status, reason);
  }

  listTransactions(
    ctx: RequestContext,
    svjId: SvjId,
    ids: readonly string[],
  ): Promise<readonly BankTransaction[]> {
    return listTransactions(ctx, svjId, ids);
  }
}
