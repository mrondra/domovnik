import { buffer as readToEnd } from 'node:stream/consumers';
import type { RequestContext } from '../../../kernel/src/context/index';
import { getObject } from '../../../kernel/src/storage/index';
import type { DocumentId } from '../domain/ids';
import { getDocument } from './queries';

export interface DocumentContent {
  readonly body: Buffer;
  readonly contentType: string;
}

/**
 * The bytes themselves, for a caller that has to read the file rather than hand it to a browser —
 * extraction from a PDF, say (task 016). A person still gets `documentDownloadUrl`: a download that
 * streams through the API is a download the API has to stay up for.
 */
export const readDocument = async (ctx: RequestContext, documentId: DocumentId): Promise<DocumentContent> => {
  const found = await getDocument(ctx, documentId);
  const object = await getObject(ctx, found.storageKey);

  return { body: await readToEnd(object.body), contentType: object.contentType };
};
