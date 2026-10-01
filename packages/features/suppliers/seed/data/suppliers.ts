import { DomainError } from '../../../../kernel/src/errors/index';
import { DEMO_SUPPLIERS_EXISTING } from './suppliers-existing';
import { DEMO_SUPPLIERS_NEW } from './suppliers-new';
import type { DemoSupplier } from './supplier-shape';

export type { DemoSupplier } from './supplier-shape';

/**
 * Invented companies with a valid IČO check digit; the seed never carries anything real. See
 * `./suppliers-existing` (task 029's address book) and `./suppliers-new` (task 030's dedicated
 * inspection firms) for what each entry is for.
 */
export const DEMO_SUPPLIERS: readonly DemoSupplier[] = [...DEMO_SUPPLIERS_EXISTING, ...DEMO_SUPPLIERS_NEW];

export const supplierNamed = (code: string): DemoSupplier => {
  const found = DEMO_SUPPLIERS.find((one) => one.code === code);
  if (found === undefined) {
    throw new DomainError(`Seed nezná dodavatele ${code}`, {
      code: 'demo_supplier_unknown',
      details: { supplier: code },
    });
  }
  return found;
};
