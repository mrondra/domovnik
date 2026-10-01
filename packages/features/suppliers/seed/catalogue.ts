import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SupplierId } from '../domain/ids';
import { demoToday } from '../../demo/index';
import {
  createContract,
  createSupplier,
  findSupplierByIco,
  listContracts,
  updateSupplier,
  type UpdateSupplierInput,
} from '../service/index';
import { DEMO_CONTRACTS } from './data/contracts';
import { DEMO_SUPPLIERS, supplierNamed } from './data/suppliers';

/**
 * `specializations` is filled in only when the row has none yet — a non-empty array that disagrees
 * with `DEMO_SUPPLIERS` is exactly what a demo/PATCH edit made between two seed runs looks like, and
 * such an edit must survive the next run untouched (docs/engineering.md §8). `phone` is filled in
 * only when the row has none at all *and* the seed actually has one to offer. Either way, an
 * unconditional `updateSupplier` on every run would both stomp an edit back to the seed value and
 * write a spurious `finance.supplier.updated` audit record even when nothing actually changed.
 */

export const seedSuppliers = async (ctx: RequestContext): Promise<ReadonlyMap<string, SupplierId>> => {
  const byCode = new Map<string, SupplierId>();

  for (const demo of DEMO_SUPPLIERS) {
    const existing = await findSupplierByIco(ctx, demo.ico);
    if (existing) {
      const patch: UpdateSupplierInput = {
        ...(existing.specializations.length === 0 ? { specializations: demo.specializations } : {}),
        ...(existing.phone === null && demo.phone !== undefined ? { phone: demo.phone } : {}),
      };
      const supplier =
        Object.keys(patch).length > 0 ? await updateSupplier(ctx, existing.id, patch) : existing;
      byCode.set(demo.code, supplier.id);
      continue;
    }
    const supplier = await createSupplier(ctx, {
      name: demo.name,
      ico: demo.ico,
      bankAccount: demo.bankAccount,
      email: demo.email,
      specializations: demo.specializations,
      phone: demo.phone,
    });
    byCode.set(demo.code, supplier.id);
  }

  return byCode;
};

/**
 * A contract has no natural key, so existence is checked per agreement (same supplier, same
 * subject) rather than "the SVJ has any contract at all" — the latter would skip every new
 * `covers`-bearing agreement on an SVJ task 029 already seeded (zadání kap. „Čím to může
 * spadnout"). Re-running it neither duplicates what is there nor overwrites what a demonstration
 * changed (docs/engineering.md §8).
 */
export const seedContracts = async (
  ctx: RequestContext,
  svjId: SvjId,
  house: number,
  suppliers: ReadonlyMap<string, SupplierId>,
): Promise<void> => {
  const current = await listContracts(ctx, svjId);

  for (const demo of DEMO_CONTRACTS[house] ?? []) {
    const supplierId = suppliers.get(demo.supplier) ?? suppliers.get(supplierNamed(demo.supplier).code);
    if (supplierId === undefined) continue;

    const already = current.some((one) => one.supplierId === supplierId && one.subject === demo.subject);
    if (already) continue;

    await createContract(ctx, {
      svjId,
      supplierId,
      subject: demo.subject,
      budgetCategory: demo.budgetCategory,
      monthlyAmount: demo.monthlyAmount ?? undefined,
      validFrom: `${String(demoToday().getUTCFullYear())}-01-01`,
      covers: demo.covers,
    });
  }
};
