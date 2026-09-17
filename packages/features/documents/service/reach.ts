import type { RequestContext } from '../../../kernel/src/context/index';
import { ForbiddenError, NotFoundError } from '../../../kernel/src/errors/index';
import { reachableSvj } from '../../../kernel/src/identity/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { DocumentId } from '../domain/ids';

/**
 * `reachableSvj` already intersects the actor's roles with the SVJ scope of the credential they
 * arrived with (ADR 0016), so nothing here needs to know whether the caller came through REST, MCP
 * or an agent.
 */
export const reachable = async (ctx: RequestContext, svjId: SvjId): Promise<boolean> => {
  const allowed = await reachableSvj(ctx);
  return allowed === null || allowed.includes(svjId);
};

/**
 * A write names the SVJ it is for, so the caller already knows it exists and hiding it would only
 * hide the reason. Reads answer `NotFoundError` instead — see `queries.ts`.
 */
export const assertReachable = async (ctx: RequestContext, svjId: SvjId): Promise<void> => {
  if (await reachable(ctx, svjId)) return;
  throw new ForbiddenError('SVJ je mimo rozsah přihlášení', {
    code: 'svj_outside_scope',
    details: { svjId },
  });
};

export const documentNotFound = (documentId: DocumentId): NotFoundError =>
  new NotFoundError('Dokument nenalezen', { code: 'document_not_found', details: { documentId } });
