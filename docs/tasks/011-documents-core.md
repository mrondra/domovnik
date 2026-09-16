# 011 – documents: schema, service, tool (minimální)

Reference: zadání kap. 4 (Dokumenty), 010.

## Navazuje na

- 010: `putObject`, `getObject`, `presignedGetUrl`, `startTestStorage()`.
- `pnpm gen:feature documents` (vytvoří kostru; `commitlint` scope `documents` už existuje).

## Cíl

Feature `documents` umí přijmout soubor od serveru (jiná feature), uložit metadata a vydat presigned URL. Bez UI, bez chunkování/embeddingů (fáze 3).

## Vytvoří / upraví

- `packages/features/documents/schema.ts`
- `domain/ids.ts` (`DocumentId`), `domain/types.ts`, `domain/schemas.ts` (zod `documentSchema`), `domain/events.ts`
- `service/index.ts`, `service/documents.service.ts` (Nest injectable obal), `service/store.ts` (`storeDocument`), `service/queries.ts` (`getDocument`, `listDocuments`), `service/links.ts` (`documentDownloadUrl`)
- `tools/get.ts` (`document.get`), `tools/list.ts` (`document.list`)
- `api/documents.module.ts` (zatím jen provider `DocumentsService`, žádný controller – modul musí existovat kvůli DI v jiných features)
- `index.ts`, `README.md`, `tests/rls.int.test.ts`, `tests/service.int.test.ts`, `tests/tools.int.test.ts`

## Rozhraní

Tabulka `document` (`svjTable`):
`title text NOT NULL`, `category document_category NOT NULL` (pgEnum: `invoice`, `contract`, `inspection_report`, `minutes`, `other`), `storage_key text NOT NULL UNIQUE(tenant)`, `content_type text`, `size integer`, `sha256 text NOT NULL`, `source text` (`email`, `upload`, `seed`, `system`), `linked_entity_type text NULL`, `linked_entity_id uuid NULL`. Index `(tenant_id, svj_id, category)`, index `(tenant_id, sha256)`.

```ts
storeDocument(ctx, { svjId, title, category, body: Buffer, contentType, source, filename, linkedEntity?: { type: string; id: string } }): Promise<Document>
  // putObject → insert → audit.record(action 'document.store') → emit documentStored
getDocument(ctx, id): Promise<Document>              // NotFoundError mimo scope/tenant
listDocuments(ctx, { svjId, category? }): Promise<Document[]>
documentDownloadUrl(ctx, id): Promise<{ url: string; expiresAt: Date }>
findBySha256(ctx, { svjId, sha256 }): Promise<Document | null>   // pro detekci duplicit v invoices
```

Event `documents.document.stored` `{ documentId, svjId, category, sha256 }`.
Tooly: `document.get` (`{ documentId } → documentSchema + downloadUrl`), `document.list` (`{ svjId, category? }`); oba `readOnly`, `userComposable`, permission `documents.read`. Přidej `documents.read` roli `finance` už má (`documents.read`), `manager` má `documents.*`; committee nemá – doplň `documents.read` do `committee` v `packages/kernel/src/identity/permissions.ts` (zapiš do reportu).

`index.ts` exportuje: `DocumentsModule`, `DocumentsService`, `storeDocument`, `getDocument`, `findBySha256`, `documentDownloadUrl`, typy `Document`, `DocumentCategory`, event `documentStored`.

## Testy

- RLS na `document`.
- Service: store → get → url (fetch 200); `findBySha256` najde stejný obsah; store mimo `svjScope` → `ForbiddenError`; audit řádek existuje.
- Tooly: `document.get` na cizí SVJ = NotFound.

## Akceptační kritéria

- `pnpm verify` zelený; `pnpm api:modules` obsahuje `DocumentsModule`.

## Mimo rozsah

Upload z UI, verze dokumentů, chunky, KB.

## Stav po dokončení

`storeDocument` a `findBySha256` dostupné pro `invoices`.
