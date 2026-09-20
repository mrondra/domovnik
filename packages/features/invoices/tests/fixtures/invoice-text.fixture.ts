import type { ExtractedInvoice } from '../../service/extraction/index';

export interface InvoiceSpec {
  readonly supplierName: string;
  readonly ico: string;
  readonly number: string;
  readonly total: number;
  readonly vat: number;
  readonly item: string;
  readonly itemAmount: number;
}

export interface InvoiceScenario {
  readonly name: string;
  readonly lines: readonly string[];
  /** What a model reading those lines should answer; the replay fixture holds exactly this. */
  readonly extracted: ExtractedInvoice;
}

const money = (value: number): string => value.toFixed(2);

const symbolOf = (number: string): string => number.replace(/\D/gu, '');

/** A plausible Czech invoice without diacritics, which is what the PDF font can draw. */
const invoiceLines = (spec: InvoiceSpec): readonly string[] => [
  'FAKTURA - DANOVY DOKLAD',
  `Cislo faktury: ${spec.number}`,
  `Dodavatel: ${spec.supplierName}`,
  `ICO: ${spec.ico}    DIC: CZ${spec.ico}`,
  'Odberatel: Spolecenstvi vlastniku Kratka 1, Praha 1',
  'Datum vystaveni: 2026-09-01     Datum splatnosti: 2026-09-30',
  `Variabilni symbol: ${symbolOf(spec.number)}`,
  'Bankovni ucet: 2801234567/2010',
  `${spec.item} ........ ${money(spec.itemAmount)} Kc`,
  `DPH 21 % ........ ${money(spec.vat)} Kc`,
  `Celkem k uhrade ........ ${money(spec.total)} Kc`,
];

const extraction = (spec: InvoiceSpec): ExtractedInvoice => ({
  supplierName: spec.supplierName,
  supplierIco: spec.ico,
  supplierDic: `CZ${spec.ico}`,
  externalNumber: spec.number,
  variableSymbol: symbolOf(spec.number),
  issuedOn: '2026-09-01',
  dueOn: '2026-09-30',
  amountTotal: spec.total,
  amountVat: spec.vat,
  currency: 'CZK',
  bankAccount: '2801234567/2010',
  lines: [{ description: spec.item, quantity: null, unitPrice: null, amount: spec.itemAmount }],
});

/** One scenario: the lines a PDF is drawn from, and the reading a model should return for them. */
export const scenario = (name: string, spec: InvoiceSpec): InvoiceScenario => ({
  name,
  lines: invoiceLines(spec),
  extracted: extraction(spec),
});
