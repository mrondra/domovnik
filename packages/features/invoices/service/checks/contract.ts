import type { Check } from '../../domain/checks';
import type { Contract, Supplier } from '../../domain/types';

/**
 * A known supplier invoicing an SVJ it has no contract with. Not a refusal — one-off repairs are
 * invoiced without one — but it is the difference between an invoice that checks itself and one
 * somebody decided about.
 */
export const contractCheck = (supplier: Supplier | null, contracts: readonly Contract[]): Check | null =>
  supplier !== null && contracts.length === 0
    ? {
        code: 'contract_missing',
        severity: 'warning',
        message: `Pro dodavatele ${supplier.name} není k tomuto dni platná smlouva.`,
        data: { supplierId: supplier.id },
      }
    : null;
