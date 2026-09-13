import { and, eq, isNull, sql } from 'drizzle-orm';
import type { RequestContext } from '../../context/index';
import { session } from '../../db/schema/index';
import { withSystem, withTenant } from '../../db/tenant';
import { UnauthenticatedError } from '../../errors/index';
import { newRowId, tenantIdSchema, userIdSchema, type UserId } from '../../ids/index';
import { hashToken, newOpaqueToken } from '../secrets';
import type { AuthenticatedUser } from './authentication';
import { systemContext } from './system-context';
import { rolesOf } from './users';

const SECONDS_PER_DAY = 86_400;
const MILLIS_PER_SECOND = 1000;

export interface IssuedSession {
  readonly token: string;
  readonly expiresAt: Date;
}

export const createSession = async (
  ctx: RequestContext,
  userId: UserId,
  ttlSeconds: number = SECONDS_PER_DAY,
): Promise<IssuedSession> => {
  const token = newOpaqueToken();
  const expiresAt = new Date(Date.now() + ttlSeconds * MILLIS_PER_SECOND);

  await withTenant(ctx, async (tx) => {
    await tx.insert(session).values({
      id: newRowId(),
      tenantId: ctx.tenantId,
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    });
  });

  return { token, expiresAt };
};

export const verifySession = async (token: string): Promise<AuthenticatedUser> => {
  const row = await withSystem({ reason: 'session lookup' }, async (tx) => {
    const rows = await tx
      .select({ userId: session.userId, tenantId: session.tenantId })
      .from(session)
      .where(
        and(
          eq(session.tokenHash, hashToken(token)),
          isNull(session.revokedAt),
          sql`${session.expiresAt} > now()`,
        ),
      )
      .limit(1);
    return rows[0];
  });

  if (row === undefined) {
    throw new UnauthenticatedError('Neplatná relace', { code: 'session_invalid' });
  }

  const tenantId = tenantIdSchema.parse(row.tenantId);
  const userId = userIdSchema.parse(row.userId);
  return { tenantId, userId, roles: await rolesOf(systemContext(tenantId), userId) };
};

export const revokeSession = async (ctx: RequestContext, token: string): Promise<void> => {
  await withTenant(ctx, async (tx) => {
    await tx
      .update(session)
      .set({ revokedAt: sql`now()` })
      .where(eq(session.tokenHash, hashToken(token)));
  });
};
