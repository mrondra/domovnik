import { PDFDocument, StandardFonts } from 'pdf-lib';

const PAGE = { width: 595, height: 842 } as const;
const MARGIN = 60;
const LINE_HEIGHT = 20;
const FONT_SIZE = 12;

/**
 * A plausible one-page invoice, built rather than committed: a binary fixture in git is a thing
 * nobody can review and everybody has to trust (task 015).
 */
export const sampleInvoicePdf = async (lines: readonly string[]): Promise<Buffer> => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([PAGE.width, PAGE.height]);

  lines.forEach((text, index) => {
    page.drawText(text, {
      x: MARGIN,
      y: PAGE.height - MARGIN - index * LINE_HEIGHT,
      size: FONT_SIZE,
      font,
    });
  });

  return Buffer.from(await pdf.save());
};

export const INVOICE_LINES: readonly string[] = [
  'FAKTURA - DANOVY DOKLAD c. 2026-0042',
  'Dodavatel: Vytahy Praha s.r.o., ICO 20000001',
  'Odberatel: Spolecenstvi vlastniku Kratka 1',
  'Datum vystaveni: 01.09.2026     Splatnost: 30.09.2026',
  'Variabilni symbol: 20260042',
  'Servis vytahu 09/2026 ................. 10 000,00 Kc',
  'DPH 21 % .............................. 2 100,00 Kc',
  'Celkem k uhrade ...................... 12 100,00 Kc',
];
