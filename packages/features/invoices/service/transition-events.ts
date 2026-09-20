import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { DomainError } from '../../../kernel/src/errors/index';
import { events } from '../../../kernel/src/events/index';
import { codesOfSeverity } from '../domain/checks';
import {
  invoiceApproved,
  invoiceExtracted,
  invoiceNeedsReview,
  invoicePaid,
  invoicePosted,
  invoiceRejected,
} from '../domain/events';
import type { InvoiceStatus } from '../domain/status';
import type { Invoice } from '../domain/types';

const incomplete = (invoice: Invoice, missing: readonly string[]): DomainError =>
  new DomainError('Faktuře chybí údaje, které tento krok vyžaduje', {
    code: 'invoice_incomplete',
    details: { invoiceId: invoice.id, status: invoice.status, missing },
  });

const missingOn = (invoice: Invoice): readonly string[] =>
  (
    [
      ['supplierId', invoice.supplierId],
      ['amountTotal', invoice.amountTotal],
      ['dueOn', invoice.dueOn],
    ] as const
  ).flatMap(([name, value]) => (value === null ? [name] : []));

/**
 * An approved invoice is one somebody has undertaken to pay, so it has to say to whom, how much and
 * by when — `payments` (020) recognises the transfer by exactly those three. Refusing here is
 * cheaper than an approved invoice nobody can pay.
 */
const approved = (invoice: Invoice): ReturnType<typeof invoiceApproved.create> => {
  const missing = missingOn(invoice);
  if (missing.length > 0) throw incomplete(invoice, missing);

  return invoiceApproved.create({
    invoiceId: invoice.id,
    svjId: invoice.svjId,
    supplierId: invoice.supplierId ?? '',
    amountTotal: invoice.amountTotal ?? 0,
    dueOn: invoice.dueOn ?? '',
    variableSymbol: invoice.variableSymbol,
    budgetCategory: invoice.budgetCategory,
  });
};

const posted = (invoice: Invoice): ReturnType<typeof invoicePosted.create> => {
  if (invoice.accountingRef === null) throw incomplete(invoice, ['accountingRef']);

  return invoicePosted.create({
    invoiceId: invoice.id,
    svjId: invoice.svjId,
    accountingRef: invoice.accountingRef,
  });
};

/**
 * Not every step is worth announcing: `pending_approval` is one the platform takes on its own and
 * nobody is waiting for. The six that follow are, and the two agentic ones carry the codes of the
 * checks that decided them rather than a sentence — an agent matches on codes (task 016).
 */
export const announce = async (
  ctx: RequestContext,
  to: InvoiceStatus,
  invoice: Invoice,
  reason: string,
): Promise<void> => {
  const onSvj = withSvj(ctx, invoice.svjId);
  const both = { invoiceId: invoice.id, svjId: invoice.svjId };

  if (to === 'extracted') {
    const warnings = codesOfSeverity(invoice.checks, 'warning');
    await events.emit(onSvj, invoiceExtracted.create({ ...both, warnings }));
  }
  if (to === 'needs_review') {
    const blocking = codesOfSeverity(invoice.checks, 'blocking');
    const reasons = blocking.length > 0 ? blocking : [reason];
    await events.emit(onSvj, invoiceNeedsReview.create({ ...both, reasons }));
  }
  if (to === 'approved') await events.emit(onSvj, approved(invoice));
  if (to === 'rejected') await events.emit(onSvj, invoiceRejected.create({ ...both, reason }));
  if (to === 'posted') await events.emit(onSvj, posted(invoice));
  if (to === 'paid') await events.emit(onSvj, invoicePaid.create(both));
};
