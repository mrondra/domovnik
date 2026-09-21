export { DocumentsModule } from './api/documents.module';
export {
  DocumentsService,
  demoReset as resetDocuments,
  documentDownloadUrl,
  findBySha256,
  getDocument,
  listDocuments,
  readDocument,
  storeDocument,
} from './service/index';

export { documentStored } from './domain/events';
export { documentIdSchema } from './domain/ids';
export type { DocumentId } from './domain/ids';
export type { Document, DocumentCategory } from './domain/types';
