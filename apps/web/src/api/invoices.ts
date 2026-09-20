import {
  invoiceDetailView,
  invoiceListView,
  type InvoiceDetailView,
  type InvoiceView,
} from '../../../../packages/features/invoices/ui/index';
import { readApi } from './client';

export interface InvoiceQuery {
  readonly status?: string | undefined;
  readonly svjId?: string | undefined;
}

const withStatus = (path: string, status: string | undefined): string =>
  status === undefined ? path : `${path}?status=${encodeURIComponent(status)}`;

/** The feature's screens fetch nothing; the pages read here and hand the data in (task 006 §5). */
export const readInvoices = (query: InvoiceQuery = {}): Promise<readonly InvoiceView[]> =>
  readApi(
    withStatus(query.svjId === undefined ? '/invoices' : `/svj/${query.svjId}/invoices`, query.status),
    invoiceListView,
    { svjId: query.svjId },
  );

export const readInvoice = (id: string, svjId?: string): Promise<InvoiceDetailView> =>
  readApi(`/invoices/${id}`, invoiceDetailView, { svjId });
