import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../context/index';
import { userRole } from '../../db/schema/index';
import { withTenant } from '../../db/tenant';
import { svjIdSchema, type SvjId, type UserId } from '../../ids/index';

/**
 * Which SVJ a user may act in. `null` means every SVJ of the tenant: a role row with no `svj_id` is
 * tenant-wide, which is how a manager or a finance officer is normally set up. A committee member or
 * an owner gets one row per SVJ instead, and that list is the answer.
 */
export const accessibleSvj = async (ctx: RequestContext, userId: UserId): Promise<readonly SvjId[] | null> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select({ svjId: userRole.svjId }).from(userRole).where(eq(userRole.userId, userId));

    if (rows.some((row) => row.svjId === null)) return null;
    return [...new Set(rows.flatMap((row) => (row.svjId === null ? [] : [svjIdSchema.parse(row.svjId)])))];
  });

const intersect = (
  left: readonly SvjId[] | null,
  right: readonly SvjId[] | undefined,
): readonly SvjId[] | null => {
  if (right === undefined) return left;
  return left === null ? right : right.filter((svjId) => left.includes(svjId));
};

/**
 * The whole answer, where `accessibleSvj` is only half of it: what the actor may reach, narrowed by
 * what the credential they arrived with may reach (ADR 0016). Anything listing across SVJ asks this.
 * `null` means every SVJ of the tenant — neither side narrowed anything.
 */
export const reachableSvj = async (ctx: RequestContext): Promise<readonly SvjId[] | null> => {
  const actor = ctx.actor;
  const byActor = actor.type === 'user' ? await accessibleSvj(ctx, actor.id) : null;
  return intersect(byActor, ctx.svjScope);
};
