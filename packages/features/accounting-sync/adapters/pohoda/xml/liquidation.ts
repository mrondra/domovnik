import { element, money, wrap } from './escape';
import type { LiquidateInput } from '../../../domain/types';

/**
 * Telling Pohoda that a received invoice has been paid, and by which bank movement. It is a
 * `listInvoiceRequest` filtered to the one invoice with a liquidation attached — the shape the
 * public documentation gives for settling a document. **Unverified**; see the README.
 */
export const liquidation = (input: LiquidateInput): string =>
  wrap('inv:invoice', [
    wrap('inv:invoiceHeader', [
      element('inv:invoiceType', 'receivedInvoice'),
      wrap('inv:id', [element('typ:id', input.accountingRef)]),
    ]),
    wrap('inv:liquidation', [
      element('typ:id', input.accountingRef),
      element('typ:amountHome', money(input.amount)),
      element('typ:date', input.paidOn),
      element('typ:bankRef', input.bankRef),
    ]),
  ]);
