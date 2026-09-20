# documents/service

The only place in this feature that reads and writes the database and object storage. Tools, other
features and the tests all come through here.

| File                   | Contents                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| `documents.service.ts` | `DocumentsService`, the injectable face `apps/api` wires up; it delegates |
| `store.ts`             | `storeDocument` — the one write: upload, row, audit row, event            |
| `queries.ts`           | `getDocument`, `listDocuments`, `findBySha256`                            |
| `content.ts`           | `readDocument` — the bytes, for a caller that has to read the file        |
| `links.ts`             | `documentDownloadUrl` — the presigned link a browser follows directly     |
| `reach.ts`             | the access question every call asks first, and the `NotFoundError`        |
| `rows.ts`              | Drizzle row → domain type, including the branded ids and the two enums    |

**The rule:** a read of an SVJ the actor may not reach answers `NotFoundError` — whether it exists
is itself something they may not learn (zadání kap. 9) — while a write to one answers
`ForbiddenError`, because the caller named that SVJ and hiding it would only hide the reason. The
narrowing itself lives in the kernel (`reachableSvj`, ADR 0016), so REST, MCP and agents agree.

Storage and the database are two systems and cannot commit together: `storeDocument` uploads first,
so a failure leaves an unreferenced object rather than a row pointing at nothing.
