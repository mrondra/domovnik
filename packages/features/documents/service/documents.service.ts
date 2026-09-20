import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { DocumentId } from '../domain/ids';
import type {
  Document,
  DocumentDownloadLink,
  FindBySha256Input,
  ListDocumentsInput,
  StoreDocumentInput,
} from '../domain/types';
import { readDocument, type DocumentContent } from './content';
import { documentDownloadUrl } from './links';
import { findBySha256, getDocument, listDocuments } from './queries';
import { storeDocument } from './store';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a tool or another feature can call the same function without Nest.
 */
@Injectable()
export class DocumentsService {
  store(ctx: RequestContext, input: StoreDocumentInput): Promise<Document> {
    return storeDocument(ctx, input);
  }

  getById(ctx: RequestContext, documentId: DocumentId): Promise<Document> {
    return getDocument(ctx, documentId);
  }

  list(ctx: RequestContext, input: ListDocumentsInput): Promise<readonly Document[]> {
    return listDocuments(ctx, input);
  }

  findBySha256(ctx: RequestContext, input: FindBySha256Input): Promise<Document | null> {
    return findBySha256(ctx, input);
  }

  read(ctx: RequestContext, documentId: DocumentId): Promise<DocumentContent> {
    return readDocument(ctx, documentId);
  }

  downloadUrl(ctx: RequestContext, documentId: DocumentId): Promise<DocumentDownloadLink> {
    return documentDownloadUrl(ctx, documentId);
  }
}
