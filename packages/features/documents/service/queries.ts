import { and, desc, eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { DocumentId } from '../domain/ids';
import type { Document, FindBySha256Input, ListDocumentsInput } from '../domain/types';
import { document } from '../schema';
import { documentNotFound, reachable } from './reach';
import { toDocument } from './rows';

const svjNotFound = (svjId: SvjId): NotFoundError =>
  new NotFoundError('SVJ nenalezeno', { code: 'svj_not_found', details: { svjId } });

/**
 * A document in an SVJ the actor may not reach answers the same as one that does not exist: whether
 * it exists is itself something they may not learn (zadání kap. 9).
 */
export const getDocument = (ctx: RequestContext, documentId: DocumentId): Promise<Document> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(document).where(eq(document.id, documentId)).limit(1);
    const row = rows[0];
    if (row === undefined) throw documentNotFound(documentId);

    const found = toDocument(row);
    if (!(await reachable(ctx, found.svjId))) throw documentNotFound(documentId);
    return found;
  });

export const listDocuments = (ctx: RequestContext, input: ListDocumentsInput): Promise<readonly Document[]> =>
  withTenant(ctx, async (tx) => {
    if (!(await reachable(ctx, input.svjId))) throw svjNotFound(input.svjId);

    const rows = await tx
      .select()
      .from(document)
      .where(
        input.category === undefined
          ? eq(document.svjId, input.svjId)
          : and(eq(document.svjId, input.svjId), eq(document.category, input.category)),
      )
      .orderBy(desc(document.createdAt));

    return rows.map(toDocument);
  });

/** The duplicate check `invoices` asks before filing a file it was sent a second time (task 011). */
export const findBySha256 = (ctx: RequestContext, input: FindBySha256Input): Promise<Document | null> =>
  withTenant(ctx, async (tx) => {
    if (!(await reachable(ctx, input.svjId))) throw svjNotFound(input.svjId);

    const rows = await tx
      .select()
      .from(document)
      .where(and(eq(document.svjId, input.svjId), eq(document.sha256, input.sha256)))
      .limit(1);

    const row = rows[0];
    return row === undefined ? null : toDocument(row);
  });
