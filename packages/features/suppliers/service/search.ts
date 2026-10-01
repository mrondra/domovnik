import { and, arrayContains, asc, eq, ilike, type SQL } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { Specialization } from '../domain/specializations';
import type { Supplier } from '../domain/types';
import { supplier } from '../schema';
import { toSupplier } from './rows';

export interface SearchSuppliersInput {
  readonly specialization?: Specialization | undefined;
  readonly text?: string | undefined;
  readonly activeOnly?: boolean | undefined;
  readonly limit?: number | undefined;
}

/**
 * The address book filtered the way a procurement flow asks it: by obor, by a bit of the name, or
 * both. `arrayContains` is what actually tests `specializations`; `eq` would compare the whole
 * array and silently match nothing (task 030 spec).
 */
export const searchSuppliers = (
  ctx: RequestContext,
  input: SearchSuppliersInput = {},
): Promise<readonly Supplier[]> =>
  withTenant(ctx, async (tx) => {
    const activeOnly = input.activeOnly ?? true;
    const limit = input.limit ?? 10;

    const conditions: SQL[] = [];
    if (activeOnly) conditions.push(eq(supplier.isActive, true));
    if (input.specialization !== undefined) {
      conditions.push(arrayContains(supplier.specializations, [input.specialization]));
    }
    if (input.text !== undefined && input.text.length > 0) {
      conditions.push(ilike(supplier.name, `%${input.text}%`));
    }

    const rows = await tx
      .select()
      .from(supplier)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(supplier.name))
      .limit(limit);

    return rows.map(toSupplier);
  });
