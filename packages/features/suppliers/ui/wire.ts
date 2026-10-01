import { z } from 'zod';
import { contractSchema, supplierSchema } from '../domain/schemas';

/**
 * What the browser side of this feature sees. Unlike `invoices`/`payments`, these schemas are
 * imported straight from `../domain/schemas` rather than copied: `index.ts` (the door with the Nest
 * module Next.js cannot compile, ADR 0017) is not on the import path from here, only `domain/`.
 */
export const supplierListView = z.array(supplierSchema).readonly();
export const supplierView = supplierSchema;
export const contractListView = z.array(contractSchema).readonly();

export type SupplierView = z.output<typeof supplierSchema>;

type ContractOutput = z.output<typeof contractSchema>;

/** One SVJ's own contracts with this supplier — a committee member never sees another SVJ's. */
export interface SvjContractsView {
  readonly svjId: string;
  readonly svjName: string;
  readonly contracts: readonly ContractOutput[];
}

/**
 * No single endpoint answers this: `apps/web` reads the supplier and, for every SVJ it may reach,
 * that SVJ's contracts, then groups them here (`apps/web/src/api/suppliers.ts`).
 */
export interface SupplierDetailView {
  readonly supplier: SupplierView;
  readonly contractsBySvj: readonly SvjContractsView[];
}
