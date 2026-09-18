import type { RequestContext } from '../../../kernel/src/context/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { reachableSvj } from '../../../kernel/src/identity/index';
import type { SvjId } from '../../../kernel/src/ids/index';

/**
 * The question every call addressing one SVJ asks first. `reachableSvj` already intersects the
 * actor's roles with the SVJ scope of the credential they arrived with (ADR 0016), so nothing here
 * needs to know whether the caller came through REST, MCP or an agent.
 *
 * It answers `NotFoundError` rather than `ForbiddenError`, the same as `svj` does: whether an SVJ
 * exists is itself something an actor outside it may not learn (zadání kap. 9). It sits in the
 * service and not in an adapter, so every implementation is behind the same door.
 */
export const assertReachable = async (ctx: RequestContext, svjId: SvjId): Promise<void> => {
  const allowed = await reachableSvj(ctx);
  if (allowed === null || allowed.includes(svjId)) return;

  throw new NotFoundError('SVJ nenalezeno', { code: 'svj_not_found', details: { svjId } });
};
