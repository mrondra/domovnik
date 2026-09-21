import { svjIdSchema } from '../../../kernel/src/ids/index';
import type { PostInvoiceInput } from '../domain/types';

/** Fixed, so the snapshots below are the same document on every machine. */
const SVJ = svjIdSchema.parse('11111111-1111-4111-8111-111111111111');

const base: PostInvoiceInput = {
  svjId: SVJ,
  invoiceId: 'f1',
  supplier: { name: 'Výtahy Praha s.r.o.', ico: '27654321', dic: 'CZ27654321' },
  externalNumber: '2026-000412',
  variableSymbol: '2026000412',
  issuedOn: '2026-09-01',
  dueOn: '2026-09-30',
  amountTotal: 12_100,
  currency: 'CZK',
  text: 'Revize výtahu',
};

/**
 * Three invoices that differ in what tends to break a document: nothing (the plain one), tax split
 * out of the total, and a supplier whose name and text carry characters XML cares about.
 */
export const RISKY: PostInvoiceInput = {
  ...base,
  invoiceId: 'f3',
  supplier: { name: 'Beran & syn <úklid>', ico: '12345678' },
  externalNumber: 'FV/2026/"0007"',
  variableSymbol: undefined,
  text: "Úklid společných prostor — září '26",
};

export const INVOICES: readonly { readonly name: string; readonly input: PostInvoiceInput }[] = [
  { name: 'without tax', input: base },
  { name: 'with tax split out', input: { ...base, amountVat: 2100, invoiceId: 'f2' } },
  { name: 'with characters that need escaping', input: RISKY },
];
