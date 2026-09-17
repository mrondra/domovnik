import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { schema, withTenant } from '../../../kernel/src/db/index';
import { newId, svjIdSchema, type SvjId } from '../../../kernel/src/ids/index';
import {
  startTestDb,
  startTestStorage,
  withTestTenant,
  type TestDatabase,
  type TestStorage,
  type TestTenant,
} from '../../../kernel/src/testing/index';
import { document, documentCategoryEnum } from '../schema';
import { storeDocument } from '../service/index';
import type { Document } from '../domain/types';

export const featureSchema = { document, documentCategoryEnum };

export interface TestWorld {
  readonly database: TestDatabase;
  readonly storage: TestStorage;
  stop(): Promise<void>;
}

/**
 * Documents are metadata plus bytes, so both containers are up for every test file here — a service
 * test that stubbed the storage would prove nothing about the pair (task 011).
 */
export const startDocumentsWorld = async (): Promise<TestWorld> => {
  const database = await startTestDb(featureSchema);
  const storage = await startTestStorage();

  return {
    database,
    storage,
    stop: async () => {
      await storage.stop();
      await database.stop();
    },
  };
};

/** An SVJ id without an `svj` row: this feature never joins to one, RLS and scope decide the rest. */
export const someSvj = (): SvjId => newId(svjIdSchema);

export const scopedTo = (ctx: RequestContext, svjScope: readonly SvjId[]): RequestContext => ({
  ...ctx,
  svjScope,
});

export const storeSample = (
  ctx: RequestContext,
  svjId: SvjId,
  overrides: { readonly title?: string; readonly body?: string } = {},
): Promise<Document> =>
  storeDocument(ctx, {
    svjId,
    title: overrides.title ?? 'Faktura 2024/001',
    category: 'invoice',
    body: Buffer.from(overrides.body ?? 'Faktura č. 2024/001'),
    contentType: 'application/pdf',
    source: 'email',
    filename: 'faktura.pdf',
  });

/** What the audit log recorded about one entity, which is the half of a mutation tests forget. */
export const auditActions = (ctx: RequestContext, entityId: string): Promise<readonly string[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ action: schema.auditLog.action })
      .from(schema.auditLog)
      .where(eq(schema.auditLog.entityId, entityId));
    return rows.map((row) => row.action);
  });

export { withTestTenant };
export type { TestTenant };
