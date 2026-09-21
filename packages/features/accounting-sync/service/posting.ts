import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError } from '../../../kernel/src/errors/index';
import { getInvoice, supplierById, transition, type InvoiceId } from '../../invoices/index';
import { accountingAdapterFor } from '../adapters/index';
import type { PostInvoiceInput } from '../domain/types';
import { jobDone, runJob } from './jobs';

const incomplete = (invoiceId: InvoiceId, missing: string): DomainError =>
  new DomainError('Fakturu nejde zapsat do účetnictví, chybí údaj', {
    code: 'invoice_not_postable',
    details: { invoiceId, missing },
  });

/** What Pohoda needs about a received invoice. An invoice missing any of it is not sent half-done. */
const postable = async (ctx: RequestContext, invoiceId: InvoiceId): Promise<PostInvoiceInput> => {
  const invoice = await getInvoice(ctx, invoiceId);
  const supplier = invoice.supplierId === null ? null : await supplierById(ctx, invoice.supplierId);

  if (supplier === null) throw incomplete(invoiceId, 'supplierId');
  if (invoice.externalNumber === null) throw incomplete(invoiceId, 'externalNumber');
  if (invoice.issuedOn === null || invoice.dueOn === null) throw incomplete(invoiceId, 'dates');
  if (invoice.amountTotal === null) throw incomplete(invoiceId, 'amountTotal');

  return {
    svjId: invoice.svjId,
    invoiceId,
    supplier: {
      name: supplier.name,
      ico: supplier.ico,
      dic: supplier.dic ?? undefined,
      bankAccount: supplier.bankAccount ?? undefined,
    },
    externalNumber: invoice.externalNumber,
    variableSymbol: invoice.variableSymbol ?? undefined,
    issuedOn: invoice.issuedOn,
    dueOn: invoice.dueOn,
    amountTotal: invoice.amountTotal,
    amountVat: invoice.amountVat ?? undefined,
    currency: invoice.currency,
    text: `Přijatá faktura ${invoice.externalNumber}`,
  };
};

/**
 * An approved invoice, written into the accounting and then marked `posted` with the reference it
 * got there (ADR 0005). The supplier goes into the address book first: Pohoda books an invoice
 * against an address, and one it does not know is one more thing for somebody to tidy up later.
 *
 * Idempotent twice over — a second delivery of the same event finds the job done and stops, and an
 * invoice that is no longer `approved` is left alone.
 */
export const postInvoice = async (ctx: RequestContext, invoiceId: InvoiceId): Promise<string | null> => {
  const invoice = await getInvoice(ctx, invoiceId);
  if (invoice.status !== 'approved') return invoice.accountingRef;
  if (await jobDone(ctx, invoice.svjId, 'post_invoice', invoiceId)) return invoice.accountingRef;

  const input = await postable(ctx, invoiceId);
  const adapter = await accountingAdapterFor(ctx, invoice.svjId);

  return runJob(
    ctx,
    {
      svjId: invoice.svjId,
      kind: 'post_invoice',
      payload: { entityId: invoiceId, externalNumber: input.externalNumber },
    },
    async () => {
      await adapter.upsertSupplier(ctx, { svjId: invoice.svjId, ...input.supplier });
      const { accountingRef } = await adapter.postReceivedInvoice(ctx, input);
      await transition(ctx, invoiceId, 'posted', { accountingRef });

      return { result: { accountingRef }, value: accountingRef };
    },
  );
};
