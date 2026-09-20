import type { Check } from '../../domain/checks';
import type { Supplier } from '../../domain/types';
import type { ExtractedInvoice } from '../extraction/schema';

/**
 * An invoice from a company nobody has on file is the one thing here that stops the process: there
 * is nothing to match it against and no account to pay it to, so a person has to look at it.
 */
export const supplierCheck = (extracted: ExtractedInvoice, supplier: Supplier | null): Check | null =>
  supplier === null
    ? {
        code: 'supplier_unknown',
        severity: 'blocking',
        message: `Dodavatel s IČO ${extracted.supplierIco} není v adresáři.`,
        data: { ico: extracted.supplierIco, name: extracted.supplierName },
      }
    : null;
