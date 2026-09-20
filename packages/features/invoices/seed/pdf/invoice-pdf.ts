import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';

export interface InvoicePdfLine {
  readonly description: string;
  readonly amount: number;
}

export interface InvoicePdfInput {
  readonly number: string;
  readonly supplierName: string;
  readonly supplierIco: string;
  readonly bankAccount: string;
  readonly customer: string;
  readonly issuedOn: string;
  readonly dueOn: string;
  readonly variableSymbol: string;
  readonly lines: readonly InvoicePdfLine[];
  readonly total: number;
  readonly vat: number;
}

const PAGE = { width: 595, height: 842 } as const;
const MARGIN = 56;
const LINE_HEIGHT = 18;
const BODY_SIZE = 11;
const TITLE_SIZE = 16;

const money = (value: number): string => `${value.toFixed(2)} Kc`;

/**
 * The font that ships with every PDF reader has no Czech diacritics, and embedding one would put a
 * megabyte of TTF in the repository for a demo file. The invoice is therefore written without them,
 * which is also a fair test of the extraction: real scans are rarely tidier.
 */
const withoutDiacritics = (value: string): string => value.normalize('NFD').replace(/\p{Diacritic}/gu, '');

const write = (page: PDFPage, font: PDFFont, text: string, row: number, size = BODY_SIZE): void => {
  page.drawText(withoutDiacritics(text), {
    x: MARGIN,
    y: PAGE.height - MARGIN - row * LINE_HEIGHT,
    size,
    font,
  });
};

const bodyOf = (input: InvoicePdfInput): readonly string[] => [
  `Cislo faktury: ${input.number}`,
  '',
  `Dodavatel: ${input.supplierName}`,
  `ICO: ${input.supplierIco}    DIC: CZ${input.supplierIco}`,
  `Bankovni ucet: ${input.bankAccount}`,
  '',
  `Odberatel: ${input.customer}`,
  '',
  `Datum vystaveni: ${input.issuedOn}     Datum splatnosti: ${input.dueOn}`,
  `Variabilni symbol: ${input.variableSymbol}`,
  '',
  'Fakturujeme Vam:',
  ...input.lines.map((line) => `${line.description} ........ ${money(line.amount)}`),
  '',
  `DPH 21 % ........ ${money(input.vat)}`,
  `Celkem k uhrade ........ ${money(input.total)}`,
];

/** One invoice as a PDF, built rather than committed — a binary in git is a file nobody reviews. */
export const invoicePdf = async (input: InvoicePdfInput): Promise<Buffer> => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([PAGE.width, PAGE.height]);

  write(page, bold, 'FAKTURA - DANOVY DOKLAD', 0, TITLE_SIZE);
  bodyOf(input).forEach((text, index) => {
    if (text !== '') write(page, font, text, index + 2);
  });

  return Buffer.from(await pdf.save());
};
