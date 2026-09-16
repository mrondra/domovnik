import type { FastifyRequest } from 'fastify';
import { createContext } from '../../../../packages/kernel/src/context/index';
import {
  rolesOf,
  verifyApiToken,
  verifySession,
  verifySignedLink,
} from '../../../../packages/kernel/src/identity/index';
import { svjIdSchema, type SvjId } from '../../../../packages/kernel/src/ids/index';
import { systemContextOf } from './system-context';
import type { Credential } from './credentials';
import type { Principal } from './state';

export const APPROVAL_LINK_PURPOSE = 'approval.decide';

const SVJ_HEADER = 'x-svj-id';

/** The SVJ switcher in the web app sends the chosen SVJ on every request. */
const requestedSvj = (request: FastifyRequest): SvjId | undefined => {
  const header = request.headers[SVJ_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  const parsed = svjIdSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

const fromSession = async (token: string, correlationId: string, svjId?: SvjId): Promise<Principal> => {
  const user = await verifySession(token);
  return {
    ctx: createContext({
      tenantId: user.tenantId,
      actor: { type: 'user', id: user.userId, roles: user.roles },
      correlationId,
      svjId,
    }),
    credential: 'session',
    allowedTools: null,
    svjScope: null,
    subjectId: null,
    sessionToken: token,
  };
};

/** The actor is the token's **owner**; the token narrows what that person may reach, never widens. */
const fromApiToken = async (token: string, correlationId: string, svjId?: SvjId): Promise<Principal> => {
  const grant = await verifyApiToken(token);
  return {
    ctx: createContext({
      tenantId: grant.tenantId,
      actor: { type: 'user', id: grant.ownerUserId, roles: grant.roles },
      correlationId,
      svjId,
      svjScope: grant.svjScope ?? undefined,
    }),
    credential: 'api-token',
    allowedTools: grant.allowedTools,
    svjScope: grant.svjScope,
    subjectId: null,
    sessionToken: null,
  };
};

const fromSignedLink = async (token: string, correlationId: string): Promise<Principal> => {
  const payload = verifySignedLink(token, APPROVAL_LINK_PURPOSE);
  const roles = await rolesOf(systemContextOf(payload.tenantId), payload.actorId);
  return {
    ctx: createContext({
      tenantId: payload.tenantId,
      actor: { type: 'user', id: payload.actorId, roles },
      correlationId,
    }),
    credential: 'signed-link',
    allowedTools: null,
    svjScope: null,
    subjectId: payload.subjectId,
    sessionToken: null,
  };
};

export const resolvePrincipal = (
  request: FastifyRequest,
  credential: Credential,
  correlationId: string,
): Promise<Principal> => {
  const svjId = requestedSvj(request);
  switch (credential.kind) {
    case 'session':
      return fromSession(credential.token, correlationId, svjId);
    case 'api-token':
      return fromApiToken(credential.token, correlationId, svjId);
    case 'signed-link':
      return fromSignedLink(credential.token, correlationId);
  }
};
