import type { RequestContext } from '../../../kernel/src/context/index';
import type { BankAccountId } from '../domain/ids';
import type { IncomingTransaction, IsoDay } from '../domain/types';

export interface FetchTransactionsInput {
  readonly bankAccountId: BankAccountId;
  readonly from: IsoDay;
  readonly to: IsoDay;
}

/**
 * Where a statement comes from (zadání kap. 8). The demo generates one that behaves like a real
 * account of a real house; Fio and Pohoda arrive later, and everything after the statement is the
 * same code — which is the point of the port in a demo with one implementation.
 */
export interface BankAdapter {
  readonly kind: 'synthetic' | 'fio' | 'pohoda';
  fetchTransactions(
    ctx: RequestContext,
    input: FetchTransactionsInput,
  ): Promise<readonly IncomingTransaction[]>;
}
