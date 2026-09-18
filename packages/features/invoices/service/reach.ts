import type { RequestContext } from '../../../kernel/src/context/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { reachableSvj } from '../../../kernel/src/identity/index';
import type { SvjId } from '../../../kernel/src/ids/index';

/**
 * The question every call addressing one SVJ asks first. `reachableSvj` already intersects the
 * actor's roles with the SVJ scope of the credential they arrived with (ADR 0016), so nothing here
 * needs to know whether the caller came through REST, MCP or an agent. An SVJ the actor may not
 * reach answers `NotFoundError`: whether it exists is itself something they may not learn.
 */
export const reachableIds = (ctx: RequestContext): Promise<readonly SvjId[] | null> => reachableSvj(ctx);

export const reachable = async (ctx: RequestContext, svjId: SvjId): Promise<boolean> => {
  const allowed = await reachableSvj(ctx);
  return allowed === null || allowed.includes(svjId);
};

export const assertReachable = async (ctx: RequestContext, svjId: SvjId): Promise<void> => {
  if (await reachable(ctx, svjId)) return;

  throw new NotFoundError('SVJ nenalezeno', { code: 'svj_not_found', details: { svjId } });
};
