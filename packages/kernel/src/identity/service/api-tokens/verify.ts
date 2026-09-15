import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { apiToken } from '../../../db/schema/index';
import { withSystem } from '../../../db/tenant';
import { UnauthenticatedError } from '../../../errors/index';
import { apiTokenIdSchema, svjIdSchema, tenantIdSchema, userIdSchema } from '../../../ids/index';
import { hashToken } from '../../secrets';
import { systemContext } from '../system-context';
import { rolesOf } from '../users';
import type { ApiTokenGrant } from './types';

/**
 * Resolving a bearer token is necessarily cross-tenant — the tenant is what it resolves. The roles
 * are read fresh every time, so losing a role immediately narrows every token the user owns.
 */
export const verifyApiToken = async (token: string): Promise<ApiTokenGrant> => {
  const row = await withSystem({ reason: 'api token lookup' }, async (tx) => {
    const rows = await tx
      .select({
        id: apiToken.id,
        tenantId: apiToken.tenantId,
        ownerUserId: apiToken.ownerUserId,
        allowedTools: apiToken.allowedTools,
        svjScope: apiToken.svjScope,
      })
      .from(apiToken)
      .where(
        and(
          eq(apiToken.tokenHash, hashToken(token)),
          isNull(apiToken.revokedAt),
          or(isNull(apiToken.expiresAt), sql`${apiToken.expiresAt} > now()`),
        ),
      )
      .limit(1);
    return rows[0];
  });

  if (row === undefined) {
    throw new UnauthenticatedError('Neplatný API token', { code: 'api_token_invalid' });
  }

  const tenantId = tenantIdSchema.parse(row.tenantId);
  const ownerUserId = userIdSchema.parse(row.ownerUserId);
  return {
    id: apiTokenIdSchema.parse(row.id),
    tenantId,
    ownerUserId,
    allowedTools: row.allowedTools,
    svjScope: row.svjScope === null ? null : row.svjScope.map((id) => svjIdSchema.parse(id)),
    roles: await rolesOf(systemContext(tenantId), ownerUserId),
  };
};
