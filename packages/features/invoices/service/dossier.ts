import type { RequestContext } from '../../../kernel/src/context/index';
import type { InvoiceId } from '../domain/ids';
import type { BudgetStatus, Contract, Invoice } from '../domain/types';
import { budgetStatus } from './budget';
import { contractById } from './contract-queries';
import { getInvoice } from './invoice-records';

export interface InvoiceDossier {
  readonly invoice: Invoice;
  readonly extraction: unknown;
  readonly checks: unknown;
  readonly contract: Contract | null;
  readonly budget: BudgetStatus | null;
}

/**
 * Everything known about one invoice, in one read. It is what `invoice.get` answers: an agent that
 * had to compose this from four tools would spend four turns getting the same picture, and the
 * pieces only mean anything next to each other (task 017).
 */
export const invoiceDossier = async (ctx: RequestContext, invoiceId: InvoiceId): Promise<InvoiceDossier> => {
  const invoice = await getInvoice(ctx, invoiceId);
  const year = Number(invoice.issuedOn?.slice(0, 4));

  return {
    invoice,
    extraction: invoice.extraction,
    checks: invoice.checks,
    contract: invoice.contractId === null ? null : await contractById(ctx, invoice.contractId),
    budget:
      invoice.budgetCategory === null || !Number.isInteger(year)
        ? null
        : await budgetStatus(ctx, { svjId: invoice.svjId, year, category: invoice.budgetCategory }),
  };
};
