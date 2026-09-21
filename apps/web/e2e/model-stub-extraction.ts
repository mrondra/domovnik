/**
 * The extraction half of the offline model: it reads the invoice out of the text layer it was sent
 * instead of inventing one, so the fields the checks then run on are the fields the demo file
 * really carries (task 026).
 */
const value = (text: string, pattern: RegExp, fallback = ''): string =>
  pattern.exec(text)?.[1]?.trim() ?? fallback;

const money = (text: string, pattern: RegExp): number => Number(value(text, pattern, '0'));

const DESCRIPTION = /\n(.+?)\s\.{2,}\s[\d.]+ Kc/u;

export interface ExtractedInvoice {
  readonly supplierName: string;
  readonly supplierIco: string;
  readonly supplierDic: string | null;
  readonly externalNumber: string;
  readonly variableSymbol: string | null;
  readonly issuedOn: string;
  readonly dueOn: string;
  readonly amountTotal: number;
  readonly amountVat: number | null;
  readonly currency: string;
  readonly bankAccount: string | null;
  readonly lines: readonly {
    readonly description: string;
    readonly quantity: null;
    readonly unitPrice: null;
    readonly amount: number;
  }[];
}

export const readInvoice = (text: string): ExtractedInvoice => {
  const amountTotal = money(text, /Celkem k uhrade \.{2,} ([\d.]+) Kc/u);

  return {
    supplierName: value(text, /Dodavatel: (.+)/u),
    supplierIco: value(text, /ICO: (\d+)/u),
    supplierDic: value(text, /DIC: (\S+)/u) || null,
    externalNumber: value(text, /Cislo faktury: (\S+)/u),
    variableSymbol: value(text, /Variabilni symbol: (\d+)/u) || null,
    issuedOn: value(text, /Datum vystaveni: (\d{4}-\d{2}-\d{2})/u),
    dueOn: value(text, /Datum splatnosti: (\d{4}-\d{2}-\d{2})/u),
    amountTotal,
    amountVat: money(text, /DPH \d+ % \.{2,} ([\d.]+) Kc/u) || null,
    currency: 'CZK',
    bankAccount: value(text, /Bankovni ucet: (\S+)/u) || null,
    lines: [
      {
        description: value(text, DESCRIPTION, 'Fakturovaná položka'),
        quantity: null,
        unitPrice: null,
        amount: amountTotal,
      },
    ],
  };
};
