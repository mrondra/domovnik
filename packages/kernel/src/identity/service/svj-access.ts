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
