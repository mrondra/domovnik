import type { Check } from '../../domain/checks';
import type { Contract } from '../../domain/types';
import type { ExtractedInvoice } from '../extraction/schema';

export const TOLERANCE = 0.1;
const PERCENT = 100;

/**
 * A monthly contract invoiced for something other than the agreed amount. Ten per cent is the band
 * an indexation or a month with a repair in it fits into; beyond that somebody should know.
 */
export const amountCheck = (extracted: ExtractedInvoice, contracts: readonly Contract[]): Check | null => {
  const agreed = contracts.find((one) => one.monthlyAmount !== null)?.monthlyAmount;
  if (agreed === undefined || agreed === null || agreed === 0) return null;

  const deviation = Math.abs(extracted.amountTotal - agreed) / agreed;
  if (deviation <= TOLERANCE) return null;

  return {
    code: 'amount_deviates',
    severity: 'warning',
    message: `Fakturováno ${String(extracted.amountTotal)} Kč proti smluvním ${String(agreed)} Kč.`,
    data: { invoiced: extracted.amountTotal, agreed, deviationPercent: deviation * PERCENT },
  };
};
