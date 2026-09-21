import type { PostInvoiceInput } from '../../../domain/types';
import { element, money, wrap } from './escape';

/** The fallback classification a received invoice is booked under; a deployment overrides it. */
export const DEFAULT_CLASSIFICATION = 'UD';

const partner = (input: PostInvoiceInput): string =>
  wrap('inv:partnerIdentity', [
    wrap('typ:address', [
      element('typ:company', input.supplier.name),
      element('typ:ico', input.supplier.ico),
      element('typ:dic', input.supplier.dic),
    ]),
  ]);

const header = (input: PostInvoiceInput, classification: string): string =>
  wrap('inv:invoiceHeader', [
    element('inv:invoiceType', 'receivedInvoice'),
    element('inv:symVar', input.variableSymbol),
    element('inv:date', input.issuedOn),
    element('inv:dateTax', input.issuedOn),
    element('inv:dateDue', input.dueOn),
    element('inv:numberOrder', input.externalNumber),
    partner(input),
    wrap('inv:classificationVAT', [element('typ:ids', classification)]),
    element('inv:text', input.text),
  ]);

/**
 * `inv:invoice` for a received invoice. The amounts go into the VAT summary rather than into item
 * lines: what we know for certain is the total and the tax, and inventing a breakdown Pohoda would
 * then book is worse than not sending one (ADR 0005).
 */
export const receivedInvoice = (input: PostInvoiceInput, classification = DEFAULT_CLASSIFICATION): string => {
  const net = input.amountTotal - (input.amountVat ?? 0);

  return wrap('inv:invoice', [
    header(input, classification),
    wrap('inv:invoiceSummary', [
      element('inv:roundingDocument', 'none'),
      wrap('inv:homeCurrency', [
        element('typ:priceHigh', money(net)),
        element('typ:priceHighVAT', money(input.amountVat ?? 0)),
        element('typ:priceHighSum', money(input.amountTotal)),
      ]),
    ]),
  ]);
};
