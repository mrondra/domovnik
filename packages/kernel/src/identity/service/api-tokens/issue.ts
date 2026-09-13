import type { RequestContext } from '../../../context/index';
import { apiToken } from '../../../db/schema/index';
import { withTenant } from '../../../db/tenant';
import { ForbiddenError } from '../../../errors/index';
import { apiTokenIdSchema, newId, type UserId } from '../../../ids/index';
import { getTools } from '../../../tools/registry/index';
import { hashToken, newOpaqueToken } from '../../secrets';
import { rolesOf } from '../users';
import type { CreateApiTokenInput, IssuedApiToken } from './types';

/**
 * A token may never carry more than its owner (zadání §9). Nothing breaks without this check —
 * `verifyApiToken` re-reads the owner's roles on every call and the registry filters by them — but
 * refusing at creation is the difference between a token that is wrong and one that looks right.
 */
const assertOwnerMayUse = async (
  ctx: RequestContext,
  ownerUserId: UserId,
  requested: readonly string[],
): Promise<void> => {
  const roles = await rolesOf(ctx, ownerUserId);
  const permitted = getTools({ names: requested, actor: { type: 'user', id: ownerUserId, roles } });
  const refused = requested.filter((name) => !permitted.some((tool) => tool.name === name));

  if (refused.length > 0) {
    throw new ForbiddenError('Token by měl víc oprávnění než jeho vlastník', {
      code: 'api_token_exceeds_owner',
      details: { tools: refused },
    });
  }
};

export const createApiToken = async (
  ctx: RequestContext,
  input: CreateApiTokenInput,
): Promise<IssuedApiToken> => {
  const id = newId(apiTokenIdSchema);
  const token = newOpaqueToken();

  await withTenant(ctx, async (tx) => {
    await assertOwnerMayUse(ctx, input.ownerUserId, input.allowedTools);
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
