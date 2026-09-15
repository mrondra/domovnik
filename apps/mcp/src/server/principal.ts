import { createContext, type RequestContext } from '../../../../packages/kernel/src/context/index';
import { UnauthenticatedError } from '../../../../packages/kernel/src/errors/index';
import { verifyApiToken } from '../../../../packages/kernel/src/identity/index';
import type { ApiTokenId, SvjId } from '../../../../packages/kernel/src/ids/index';
import { getTools, type RegisteredTool } from '../../../../packages/kernel/src/tools/index';

const BEARER = /^Bearer (?<token>\S+)$/;

export interface McpPrincipal {
  readonly ctx: RequestContext;
  readonly tokenId: ApiTokenId;
  readonly allowedTools: readonly string[];
  readonly svjScope: readonly SvjId[] | null;
}

/** Every call the token makes is attributable to it, on top of the owner it acts as (zadání kap. 9). */
export const auditVia = (principal: McpPrincipal): string => `api_token:${principal.tokenId}`;

/**
 * The actor is the token's **owner**, never the token: the roles are read fresh on every request, so
 * a role taken away narrows every token that person holds without anyone revoking anything.
 */
export const authenticate = async (authorization: string | undefined): Promise<McpPrincipal> => {
  const token = BEARER.exec(authorization ?? '')?.groups?.['token'];
  if (token === undefined) {
    throw new UnauthenticatedError('Chybí Authorization: Bearer <token>', { code: 'api_token_missing' });
  }

  const grant = await verifyApiToken(token);
  return {
    ctx: createContext({
      tenantId: grant.tenantId,
      actor: { type: 'user', id: grant.ownerUserId, roles: grant.roles },
    }),
    tokenId: grant.id,
    allowedTools: grant.allowedTools,
    svjScope: grant.svjScope,
  };
};

/**
 * What this connection may see: the tools named in the token, intersected with what its owner is
 * permitted to do right now. The token can only ever narrow — it is a subset, not a grant.
 */
export const toolsFor = (principal: McpPrincipal): readonly RegisteredTool[] =>
  getTools({ names: principal.allowedTools, actor: principal.ctx.actor });
