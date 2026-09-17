import { audit } from '../../../kernel/src/audit/index';
import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { events } from '../../../kernel/src/events/index';
import { newId } from '../../../kernel/src/ids/index';
import { putObject, storageKeyFor } from '../../../kernel/src/storage/index';
import { documentStored } from '../domain/events';
import { documentIdSchema } from '../domain/ids';
import type { Document, StoreDocumentInput } from '../domain/types';
import { document } from '../schema';
import { assertReachable } from './reach';

/** The key prefix this feature owns in the shared bucket (kernel `storageKeyFor`). */
const AREA = 'documents';

const describe = (created: Document): Record<string, unknown> => ({
  title: created.title,
  category: created.category,
  sha256: created.sha256,
  storageKey: created.storageKey,
});

/**
 * The bytes go to storage before the row exists, so a failed insert leaves an unreferenced object
 * rather than a row pointing at nothing — the harmless half of the pair. Uploading inside the
 * transaction would hold it open for the length of a network transfer instead.
 */
export const storeDocument = async (ctx: RequestContext, input: StoreDocumentInput): Promise<Document> => {
  await assertReachable(ctx, input.svjId);

  const key = storageKeyFor(ctx, AREA, input.filename);
  const stored = await putObject(ctx, key, input.body, input.contentType);

  const created: Document = {
    id: newId(documentIdSchema),
    svjId: input.svjId,
    title: input.title,
    category: input.category,
    storageKey: stored.key,
    contentType: input.contentType,
    size: stored.size,
    sha256: stored.sha256,
    source: input.source,
    linkedEntity: input.linkedEntity ?? null,
  };

  return withTenant(ctx, async (tx) => {
    await tx.insert(document).values({
      id: created.id,
      tenantId: ctx.tenantId,
      svjId: created.svjId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      title: created.title,
      category: created.category,
      storageKey: created.storageKey,
      contentType: created.contentType,
      size: created.size,
      sha256: created.sha256,
      source: created.source,
      linkedEntityType: created.linkedEntity?.type ?? null,
      linkedEntityId: created.linkedEntity?.id ?? null,
    });

    await audit.record(ctx, {
      action: 'document.store',
      entity: 'document',
      entityId: created.id,
      reason: 'Uložen dokument',
      after: describe(created),
    });

    await events.emit(
      withSvj(ctx, created.svjId),
      documentStored.create({
        documentId: created.id,
        svjId: created.svjId,
        category: created.category,
        sha256: created.sha256,
      }),
    );

    return created;
  });
};
