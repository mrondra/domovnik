import type { RequestContext } from '../../../kernel/src/context/index';
import { loadEnv } from '../../../kernel/src/env/index';
import { presignedGetUrl } from '../../../kernel/src/storage/index';
import type { DocumentId } from '../domain/ids';
import type { DocumentDownloadLink } from '../domain/types';
import { getDocument } from './queries';

const MILLISECONDS = 1000;

/**
 * A short-lived link the browser follows directly, so a download never streams through the API. The
 * signature carries no identity, which is why the caller is checked here — through `getDocument`,
 * the same read every other caller goes through — and the lifetime is measured in minutes.
 */
export const documentDownloadUrl = async (
  ctx: RequestContext,
  documentId: DocumentId,
): Promise<DocumentDownloadLink> => {
  const found = await getDocument(ctx, documentId);
  const ttlSeconds = loadEnv().S3_PRESIGN_TTL_SECONDS;

  return {
    url: await presignedGetUrl(ctx, found.storageKey, ttlSeconds),
    expiresAt: new Date(Date.now() + ttlSeconds * MILLISECONDS),
  };
};
