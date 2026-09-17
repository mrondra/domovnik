# documents

Every file the platform keeps for an SVJ: the invoice that arrived by e-mail, the contract, the
inspection report, the minutes of an assembly. The bytes live in object storage through the kernel;
this feature owns the metadata about them and the link that lets someone read one.

| File / directory | Contents                                                              |
| ---------------- | --------------------------------------------------------------------- |
| `schema.ts`      | `document` — through `svjTable`, with the `document_category` enum    |
| `domain/`        | the types, the zod shapes and the one event definition                |
| `service/`       | the only place that mutates; emits the event and writes the audit row |
| `tools/`         | `document.get`, `document.list` — read-only and user-composable       |
| `api/`           | the Nest module `apps/api` discovers; no controller in phase 1        |
| `tests/`         | the RLS isolation test, the service tests and the tool tests          |
| `index.ts`       | the public face: what other features and apps may import              |

**The rule:** everything outside this directory sees the feature through `index.ts` only. Reach
another feature through its `index.ts` or an event, never through its tables (docs/engineering.md §2).

Three decisions worth knowing before changing anything here:

- Nothing outside the kernel touches S3. `storeDocument` takes the bytes and returns metadata; a
  reader gets a presigned link from `documentDownloadUrl`, never a stream through the API.
- A document is recognised by `sha256`, not by its name: the same invoice sent twice is the same
  file, which is what `findBySha256` answers for `invoices`.
- `linkedEntity` is an untyped pair — the feature that produced the document says what it points at.
  A foreign key here would make `documents` depend on every feature that files anything.

In phase 1 only the server stores documents, so there is no controller and no upload screen; the
chunks, the embeddings and the knowledge base are phase 3 (zadání kap. 4).
