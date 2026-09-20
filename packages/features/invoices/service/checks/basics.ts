import type { Check } from '../../domain/checks';
import type { ExtractedInvoice } from '../extraction/schema';

const DAY = 24 * 60 * 60 * 1000;
export const DUE_SOON_DAYS = 7;

/** A payment term that is already nearly up when the invoice arrives; someone should see it early. */
export const dueSoonCheck = (extracted: ExtractedInvoice, now: Date): Check | null => {
  const days = Math.floor((Date.parse(extracted.dueOn) - now.getTime()) / DAY);
  if (Number.isNaN(days) || days >= DUE_SOON_DAYS) return null;

  return {
    code: 'due_soon',
    severity: 'info',
    message: `Splatnost je za ${String(days)} dní (${extracted.dueOn}).`,
    data: { dueOn: extracted.dueOn, days },
  };
};

/** Without a variable symbol the payment will be harder to match later, but nothing is wrong now. */
export const variableSymbolCheck = (extracted: ExtractedInvoice): Check | null =>
  extracted.variableSymbol === null || extracted.variableSymbol.trim() === ''
    ? {
        code: 'vs_missing',
        severity: 'info',
        message: 'Faktura neuvádí variabilní symbol.',
      }
    : null;
