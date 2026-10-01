import {
  contractListView,
  supplierListView,
  supplierView,
  type SupplierDetailView,
  type SupplierView,
} from '../../../../packages/features/suppliers/ui/index';
import { listSvj } from './svj';
import { readApi } from './client';

export interface SupplierQuery {
  readonly specialization?: string | undefined;
  readonly q?: string | undefined;
}

const queryStringOf = (query: SupplierQuery): string => {
  const params = new URLSearchParams();
  if (query.specialization !== undefined) params.set('specialization', query.specialization);
  if (query.q !== undefined) params.set('q', query.q);
  const search = params.toString();
  return search === '' ? '' : `?${search}`;
};

/** The feature's screens fetch nothing; the pages read here and hand the data in (task 006 §5). */
export const readSuppliers = (query: SupplierQuery = {}): Promise<readonly SupplierView[]> =>
  readApi(`/suppliers${queryStringOf(query)}`, supplierListView);

/**
 * `GET /suppliers/:id` answers only the supplier; no single endpoint says "this supplier's
 * contracts across every SVJ I may reach" (`ui/README.md`), so this reads one SVJ at a time and
 * groups what it finds — a committee member's `listSvj()` already holds nothing outside their reach.
 */
export const readSupplierDetail = async (id: string): Promise<SupplierDetailView> => {
  const [supplier, svjOptions] = await Promise.all([readApi(`/suppliers/${id}`, supplierView), listSvj()]);

  const contractsBySvj = await Promise.all(
    svjOptions.map(async (svj) => {
      const contracts = await readApi(`/svj/${svj.id}/contracts`, contractListView, { svjId: svj.id });
      return {
        svjId: svj.id,
        svjName: svj.name,
        contracts: contracts.filter((one) => one.supplierId === id),
      };
    }),
  );

  return { supplier, contractsBySvj: contractsBySvj.filter((group) => group.contracts.length > 0) };
};
