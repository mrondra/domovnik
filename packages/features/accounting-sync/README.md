# accounting-sync

The seam between the platform and the accounting. Pohoda is the source of truth for the books
(ADR 0005): we tell it about an invoice somebody approved and about money that arrived, and we read
back what it says. We never decide on its behalf, and we never overwrite it.

| File / directory | Contents                                                                  |
| ---------------- | ------------------------------------------------------------------------- |
| `schema.ts`      | re-exports `schema/`: the link, the jobs, the conflicts, the mock's store |
| `domain/`        | what an invoice, a statement line and a link look like on this side       |
| `adapters/`      | the port, the `dataPack` documents, the demo's Pohoda and the real one    |
| `service/`       | which accounting unit an SVJ is                                           |
| `api/`           | the Nest module `apps/api` discovers; no controller before task 025       |
| `tests/`         | the contract suite both implementations answer, and the XML snapshots     |
| `index.ts`       | the public face: what other features and apps may import                  |

**Unverified against a real Pohoda.** Verification on POHODA Start is the precondition ADR 0005
names for this adapter, and it has not happened. The documents follow the public `dataPack` 2.x
documentation; `adapters/pohoda/xml/README.md` lists element by element what is unconfirmed, and
`resolve.ts` refuses to serve an SVJ through mServer rather than pretending otherwise.

A disagreement between our copy and Pohoda becomes a `sync_conflict`, never an overwrite. Something
that changed in the accounting was changed by a person who meant it.
