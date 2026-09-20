import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SupplierId } from '../domain/ids';
import {
  createContract,
  createSupplier,
  findSupplierByIco,
  listContracts,
  setBudgetLine,
} from '../service/index';
import { DEMO_BUDGETS } from './data/budget';
import { DEMO_CONTRACTS } from './data/contracts';
import { DEMO_SUPPLIERS, supplierNamed } from './data/suppliers';

/** Idempotent by IČO, which is the key a real address book is kept by too (zadání kap. 4). */
export const seedSuppliers = async (ctx: RequestContext): Promise<ReadonlyMap<string, SupplierId>> => {
  const byCode = new Map<string, SupplierId>();

  for (const demo of DEMO_SUPPLIERS) {
    const existing = await findSupplierByIco(ctx, demo.ico);
    const supplier =
      existing ??
      (await createSupplier(ctx, {
        name: demo.name,
        ico: demo.ico,
        bankAccount: demo.bankAccount,
        email: demo.email,
      }));
    byCode.set(demo.code, supplier.id);
  }

  return byCode;
};

/**
 * A contract has no natural key — the same supplier can have two of them for the same SVJ over the
 * years — so the seed leaves an SVJ alone once it has any. Re-running it neither duplicates what
 * is there nor overwrites what a demonstration changed (docs/engineering.md §8).
 */
export const seedContracts = async (
  ctx: RequestContext,
  svjId: SvjId,
  house: number,
  suppliers: ReadonlyMap<string, SupplierId>,
): Promise<void> => {
  if ((await listContracts(ctx, svjId)).length > 0) return;

  for (const demo of DEMO_CONTRACTS[house] ?? []) {
    const supplierId = suppliers.get(demo.supplier) ?? suppliers.get(supplierNamed(demo.supplier).code);
    if (supplierId === undefined) continue;

    await createContract(ctx, {
      svjId,
      supplierId,
      subject: demo.subject,
      budgetCategory: demo.budgetCategory,
      monthlyAmount: demo.monthlyAmount ?? undefined,
      validFrom: `${String(new Date().getUTCFullYear())}-01-01`,
    });
  }
};

/** Idempotent by `(tenant, svj, year, category)`; a second plan for a line is a correction. */
export const seedBudget = async (
  ctx: RequestContext,
  svjId: SvjId,
  house: number,
  year: number,
): Promise<void> => {
  for (const demo of DEMO_BUDGETS[house] ?? []) {
    await setBudgetLine(ctx, {
      svjId,
      year,
      category: demo.category,
      plannedAmount: demo.plannedAmount,
    });
  }
};
