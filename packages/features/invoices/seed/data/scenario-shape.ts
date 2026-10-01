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

const DAY_MS = 86_400_000;

/** A demonstration invoice is payable this many days after the day it is issued. */
const DAYS_TO_PAY = 29;

const isoDay = (at: Date): string => at.toISOString().slice(0, 10);

/**
 * The year and month the invoices of a given day are about, as the PDF and the mail subject print
 * them. They come from the same day `dated` issues on, so the number, the variable symbol and the
 * text of the line never disagree.
 */
export const periodOf = (today: Date): { readonly year: string; readonly label: string } => {
  const year = String(today.getUTCFullYear());
  return { year, label: `${String(today.getUTCMonth() + 1).padStart(2, '0')}/${year}` };
};

/**
 * Issued on `today` and due `DAYS_TO_PAY` days later, so the due date is always after the day the
 * bank statement of the demo ends on (that is `today` too) and the invoice stays unpaid. A fixed
 * date would sit inside the statement from the day it passed and the bank sync would pay it.
 */
export const dated = (
  today: Date,
  suffix: string,
): Pick<InvoicePdfInput, 'number' | 'variableSymbol' | 'issuedOn' | 'dueOn'> => {
  const { year } = periodOf(today);
  return {
    number: `${year}-${suffix}`,
    variableSymbol: `${year}${suffix}`,
    issuedOn: isoDay(today),
    dueOn: isoDay(new Date(today.getTime() + DAYS_TO_PAY * DAY_MS)),
  };
};

export const withVat = (net: number): { total: number; vat: number } => ({
  total: net,
  vat: Math.round(net * (0.21 / 1.21) * 100) / 100,
});
