import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../context/index';
import { user, userRole } from '../../db/schema/index';
import { withTenant } from '../../db/tenant';
import { NotFoundError } from '../../errors/index';
import { newId, newRowId, userIdSchema, type SvjId, type UserId } from '../../ids/index';
import type { Role } from '../roles';
import { hashPassword } from '../secrets';

export interface CreateUserInput {
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
  readonly roles: readonly Role[];
  readonly svjId?: SvjId | undefined;
}

export const createUser = async (ctx: RequestContext, input: CreateUserInput): Promise<UserId> => {
  const userId = newId(userIdSchema);
  const passwordHash = await hashPassword(input.password);

  await withTenant(ctx, async (tx) => {
    await tx.insert(user).values({
      id: userId,
      tenantId: ctx.tenantId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      email: input.email,
      displayName: input.displayName,
      passwordHash,
    });
    await tx.insert(userRole).values(
      input.roles.map((role) => ({
        id: newRowId(),
        tenantId: ctx.tenantId,
        userId,
        role,
        svjId: input.svjId ?? null,
      })),
    );
  });

  return userId;
};

export const rolesOf = async (ctx: RequestContext, userId: UserId): Promise<readonly Role[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select({ role: userRole.role }).from(userRole).where(eq(userRole.userId, userId));
    return rows.map((row) => row.role);
  });

/**
 * Everyone in this tenant who holds a role, whatever SVJ their row is scoped to. It is what a
 * feature asks when an approval is addressed to a job rather than to a person — the accountants,
 * the managers — and there is nowhere else that knows (task 022).
 */
export const usersWithRole = (ctx: RequestContext, role: Role): Promise<readonly UserId[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select({ userId: userRole.userId }).from(userRole).where(eq(userRole.role, role));

    return [...new Set(rows.map((row) => userIdSchema.parse(row.userId)))];
  });

export const requireUser = async (ctx: RequestContext, userId: UserId): Promise<{ email: string }> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
    const found = rows[0];
    if (found === undefined) {
      throw new NotFoundError('Uživatel nenalezen', { code: 'user_not_found', details: { userId } });
    }
    return found;
  });
