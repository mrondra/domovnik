import type { RequestContext } from '../../../kernel/src/context/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { reachableSvj } from '../../../kernel/src/identity/index';
import type { SvjId } from '../../../kernel/src/ids/index';

/**
 * The question every call addressing one SVJ asks first. `reachableSvj` already intersects the
 * actor's roles with the SVJ scope of the credential they arrived with (ADR 0016). An SVJ the
 * actor may not reach answers `NotFoundError`: whether it exists is not theirs to learn.
 */
export const assertReachable = async (ctx: RequestContext, svjId: SvjId): Promise<void> => {
  const allowed = await reachableSvj(ctx);
  if (allowed === null || allowed.includes(svjId)) return;

  throw new NotFoundError('SVJ nenalezeno', { code: 'svj_not_found', details: { svjId } });
};
