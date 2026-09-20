import type { InvoicePdfInput } from '../pdf/invoice-pdf';

export interface DemoScenario {
  readonly code: string;
  readonly title: string;
  /** What the scenario is there to show; it is what the demo screen prints under the title. */
  readonly description: string;
  /** Which of the three seeded SVJ it arrives at, in the order the `svj` seed writes them. */
  readonly house: 0 | 1 | 2;
  /** A supplier from the address book, by its code. */
  readonly supplier?: string | undefined;
  /** Or one that is deliberately not in it — that is the whole point of one of the scenarios. */
  readonly strangerSupplier?:
    { readonly name: string; readonly ico: string; readonly bankAccount: string } | undefined;
  readonly subject: string;
  readonly invoice: Omit<InvoicePdfInput, 'supplierName' | 'supplierIco' | 'bankAccount' | 'customer'>;
  /** Set on the scenario that re-sends an earlier one's file; nothing new is generated for it. */
  readonly repeats?: string | undefined;
}

export const dated = (
  number: string,
  variableSymbol: string,
): Pick<InvoicePdfInput, 'number' | 'variableSymbol' | 'issuedOn' | 'dueOn'> => ({
  number,
  variableSymbol,
  issuedOn: '2026-09-01',
  dueOn: '2026-09-30',
});

export const withVat = (net: number): { total: number; vat: number } => ({
  total: net,
  vat: Math.round(net * (0.21 / 1.21) * 100) / 100,
});
