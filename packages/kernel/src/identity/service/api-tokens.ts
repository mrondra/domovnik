import { and, eq, isNull, or, sql } from 'drizzle-orm';
import type { RequestContext } from '../../context/index';
import { apiToken } from '../../db/schema/index';
import { withSystem, withTenant } from '../../db/tenant';
import { ForbiddenError } from '../../errors/index';
import {
  apiTokenIdSchema,
  newId,
  svjIdSchema,
  tenantIdSchema,
  userIdSchema,
  type ApiTokenId,
  type SvjId,
  type TenantId,
  type UserId,
} from '../../ids/index';
import type { Role } from '../roles';
import { hashToken, newOpaqueToken } from '../secrets';
import { systemContext } from './system-context';
import { rolesOf } from './users';

export interface CreateApiTokenInput {
  readonly name: string;
  readonly ownerUserId: UserId;
  readonly allowedTools: readonly string[];
  readonly svjScope?: readonly SvjId[] | undefined;
  readonly expiresAt?: Date | undefined;
}

export interface IssuedApiToken {
  readonly id: ApiTokenId;
  readonly token: string;
}

export const createApiToken = async (
  ctx: RequestContext,
  input: CreateApiTokenInput,
): Promise<IssuedApiToken> => {
  const id = newId(apiTokenIdSchema);
  const token = newOpaqueToken();

  await withTenant(ctx, async (tx) => {
    await tx.insert(apiToken).values({
      id,
      tenantId: ctx.tenantId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      name: input.name,
      ownerUserId: input.ownerUserId,
      tokenHash: hashToken(token),
      allowedTools: input.allowedTools,
      svjScope: input.svjScope ?? null,
      expiresAt: input.expiresAt ?? null,
    });
  });

  return { id, token };
};

export interface ApiTokenGrant {
  readonly tenantId: TenantId;
  readonly ownerUserId: UserId;
  readonly allowedTools: readonly string[];
  readonly svjScope: readonly SvjId[] | null;
  readonly roles: readonly Role[];
}

export const verifyApiToken = async (token: string): Promise<ApiTokenGrant> => {
  const row = await withSystem({ reason: 'api token lookup' }, async (tx) => {
    const rows = await tx
      .select({
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
    throw new ForbiddenError('Neplatný API token', { code: 'api_token_invalid' });
  }

  const tenantId = tenantIdSchema.parse(row.tenantId);
  const ownerUserId = userIdSchema.parse(row.ownerUserId);
  return {
    tenantId,
    ownerUserId,
    allowedTools: row.allowedTools,
    svjScope: row.svjScope === null ? null : row.svjScope.map((id) => svjIdSchema.parse(id)),
    roles: await rolesOf(systemContext(tenantId), ownerUserId),
  };
};

export const revokeApiToken = async (ctx: RequestContext, id: ApiTokenId): Promise<void> => {
  await withTenant(ctx, async (tx) => {
    await tx
      .update(apiToken)
      .set({ revokedAt: sql`now()` })
      .where(eq(apiToken.id, id));
  });
};
