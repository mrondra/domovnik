import type { RequestContext } from '../../../kernel/src/context/index';
import { reachableSvj } from '../../../kernel/src/identity/index';
import type { SvjId } from '../../../kernel/src/ids/index';

/**
 * The question every read addressing one SVJ asks first. `reachableSvj` already intersects the
 * actor's roles with the SVJ scope of the credential they arrived with (ADR 0016), so nothing here
 * needs to know whether the caller came through REST, MCP or an agent.
 */
export const reachable = async (ctx: RequestContext, svjId: SvjId): Promise<boolean> => {
  const allowed = await reachableSvj(ctx);
  return allowed === null || allowed.includes(svjId);
};
