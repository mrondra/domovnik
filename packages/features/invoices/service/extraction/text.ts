import { PDFParse } from 'pdf-parse';
import { DomainError } from '../../../../kernel/src/errors/index';

/** Below this, the PDF is a scan and there is nothing to read. OCR is out of scope (task 016). */
export const MIN_TEXT_LENGTH = 50;

export const NO_TEXT = 'pdf_no_text';

/**
 * The text layer of the PDF, and nothing else: no OCR, no layout, no images. A scanned invoice has
 * none, and this says so loudly rather than handing the model an empty page to invent from.
 */
export const pdfText = async (body: Buffer): Promise<string> => {
  const parser = new PDFParse({ data: new Uint8Array(body) });
  try {
    const { text } = await parser.getText();
    if (text.trim().length < MIN_TEXT_LENGTH) {
      throw new DomainError('PDF neobsahuje čitelný text', {
        code: NO_TEXT,
        details: { length: text.trim().length },
      });
    }
    return text;
  } finally {
    await parser.destroy();
  }
};
