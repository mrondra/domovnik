import type { SvjId } from '../../../kernel/src/ids/index';
import type { StorageKey } from '../../../kernel/src/storage/index';
import type { DocumentId } from './ids';

export type DocumentCategory = 'invoice' | 'contract' | 'inspection_report' | 'minutes' | 'other';

export type DocumentSource = 'email' | 'upload' | 'seed' | 'system';

/** What the document is about, in the words of the feature that produced it — never a foreign key. */
export interface LinkedEntity {
  readonly type: string;
  readonly id: string;
}

export interface Document {
  readonly id: DocumentId;
  readonly svjId: SvjId;
  readonly title: string;
  readonly category: DocumentCategory;
  readonly storageKey: StorageKey;
  readonly contentType: string | null;
  readonly size: number | null;
  readonly sha256: string;
  readonly source: DocumentSource | null;
  readonly linkedEntity: LinkedEntity | null;
}

export interface StoreDocumentInput {
  readonly svjId: SvjId;
  readonly title: string;
  readonly category: DocumentCategory;
  readonly body: Buffer;
  readonly contentType: string;
  readonly source: DocumentSource;
  /** Only its extension survives; the stored name is a fresh uuid (kernel `storageKeyFor`). */
  readonly filename: string;
  readonly linkedEntity?: LinkedEntity | undefined;
}

export interface ListDocumentsInput {
  readonly svjId: SvjId;
  readonly category?: DocumentCategory | undefined;
}

export interface FindBySha256Input {
  readonly svjId: SvjId;
  readonly sha256: string;
}

export interface DocumentDownloadLink {
  readonly url: string;
  readonly expiresAt: Date;
}
