import { asc, count, eq, inArray } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { reachableSvj } from '../../../kernel/src/identity/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SvjSummary } from '../domain/types';
import { svj, unit } from '../schema';
import { asSvjId } from './rows';

/** `null` is every SVJ of the tenant; an empty list is nobody, and asks the database nothing. */
const summaries = (ctx: RequestContext, svjIds: readonly SvjId[] | null): Promise<readonly SvjSummary[]> => {
  if (svjIds !== null && svjIds.length === 0) return Promise.resolve([]);

  return withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ id: svj.id, name: svj.name, unitCount: count(unit.id) })
      .from(svj)
      .leftJoin(unit, eq(unit.svjId, svj.id))
      .where(svjIds === null ? undefined : inArray(svj.id, [...svjIds]))
      .groupBy(svj.id, svj.name)
      .orderBy(asc(svj.name));

    return rows.map((row) => ({ id: asSvjId(row.id), name: row.name, unitCount: row.unitCount }));
  });
};

/**
 * The read model other features may use (docs/engineering.md §2). It is bound by RLS to the tenant
 * and by nothing else — a caller that has to respect who is asking uses `listForActor`.
 */
export const svjSummary = (ctx: RequestContext): Promise<readonly SvjSummary[]> => summaries(ctx, null);

/** Every list across SVJ in the UI, the API and the tools comes from here. */
export const listForActor = async (ctx: RequestContext): Promise<readonly SvjSummary[]> =>
  summaries(ctx, await reachableSvj(ctx));
