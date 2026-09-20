export { DocumentsModule } from './api/documents.module';
export {
  DocumentsService,
  documentDownloadUrl,
  findBySha256,
  getDocument,
  readDocument,
  storeDocument,
} from './service/index';

export { documentStored } from './domain/events';
export { documentIdSchema } from './domain/ids';
export type { DocumentId } from './domain/ids';
export type { Document, DocumentCategory } from './domain/types';
