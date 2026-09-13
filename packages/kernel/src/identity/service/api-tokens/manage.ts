import { desc, eq, sql } from 'drizzle-orm';
import type { RequestContext } from '../../../context/index';
import { apiToken } from '../../../db/schema/index';
import { withTenant } from '../../../db/tenant';
import { NotFoundError } from '../../../errors/index';
import { apiTokenIdSchema, svjIdSchema, userIdSchema, type ApiTokenId } from '../../../ids/index';
import type { ApiTokenSummary } from './types';

/** The plaintext is not here and never will be — only its HMAC was ever stored. */
export const listApiTokens = async (ctx: RequestContext): Promise<readonly ApiTokenSummary[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({
        id: apiToken.id,
        name: apiToken.name,
        ownerUserId: apiToken.ownerUserId,
        allowedTools: apiToken.allowedTools,
        svjScope: apiToken.svjScope,
        expiresAt: apiToken.expiresAt,
        lastUsedAt: apiToken.lastUsedAt,
        revokedAt: apiToken.revokedAt,
        createdAt: apiToken.createdAt,
      })
      .from(apiToken)
      .orderBy(desc(apiToken.createdAt));

    return rows.map((row) => ({
      ...row,
      id: apiTokenIdSchema.parse(row.id),
      ownerUserId: userIdSchema.parse(row.ownerUserId),
      svjScope: row.svjScope === null ? null : row.svjScope.map((id) => svjIdSchema.parse(id)),
    }));
  });

export const revokeApiToken = async (ctx: RequestContext, id: ApiTokenId): Promise<void> => {
  await withTenant(ctx, async (tx) => {
    const revoked = await tx
      .update(apiToken)
      .set({ revokedAt: sql`now()` })
      .where(eq(apiToken.id, id))
      .returning({ id: apiToken.id });

    if (revoked.length === 0) {
      throw new NotFoundError('Token nenalezen', { code: 'api_token_not_found', details: { id } });
    }
  });
};
