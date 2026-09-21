import {
  transactionDetailView,
  transactionListView,
  type TransactionDetailView,
  type TransactionView,
} from '../../../../packages/features/payments/ui/index';
import { callApi, readApi, type ApiResult } from './client';

export interface TransactionQuery {
  readonly svjId: string;
  readonly status?: string | undefined;
}

const withStatus = (path: string, status: string | undefined): string =>
  status === undefined || status === 'all' ? path : `${path}?status=${encodeURIComponent(status)}`;

/** The feature's screens fetch nothing; the pages read here and hand the data in (task 006 §5). */
export const readTransactions = (query: TransactionQuery): Promise<readonly TransactionView[]> =>
  readApi(withStatus(`/svj/${query.svjId}/transactions`, query.status), transactionListView, {
    svjId: query.svjId,
  });

export const readTransaction = (id: string, svjId: string): Promise<TransactionDetailView> =>
  readApi(`/transactions/${id}`, transactionDetailView, { svjId });

export interface ManualMatchBody {
  readonly targetType: 'prescription' | 'invoice';
  readonly targetId: string;
  readonly amount: number;
}

export const matchTransaction = (
  id: string,
  svjId: string,
  body: ManualMatchBody,
): Promise<ApiResult<TransactionDetailView>> =>
  callApi(`/transactions/${id}/match`, transactionDetailView, { method: 'POST', body, svjId });
