# invoices

Incoming invoices and everything they are matched against: the suppliers of the management company,
the contracts an SVJ has with them, and the budget the spending is counted towards. Pohoda stays the
source of truth for the accounting itself (ADR 0005); what lives here is the process in front of it.

| File / directory | Contents                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `schema.ts`      | re-exports `schema/`, which is where the five tables actually live             |
| `domain/`        | the types, the zod shapes, the six events and the status machine               |
| `service/`       | the only place that writes; every step audited, the five that matter announced |
| `api/`           | the Nest module `apps/api` discovers; no controller before task 018            |
| `tests/`         | the RLS isolation tests, the machine's own table test, and the service tests   |
| `index.ts`       | the public face: what other features and apps may import                       |

**The rule:** everything outside this directory sees the feature through `index.ts` only. Reach
another feature through its `index.ts` or an event, never through its tables (docs/engineering.md §2).

Three decisions worth knowing before changing anything here:

- An invoice only ever moves through `transition`, which checks `domain/status.ts` first. The status
  is the machine's and not the caller's, so a controller, a tool and an agent all get the same
  answer to "may this happen now?".
- A supplier is tenant-wide and a contract is not. The same lift service invoices several houses;
  what it agreed with one of them, and what it billed them, belongs to that house.
- `extraction` and `checks` are kept as they were — what the model read, and what the deterministic
  rules made of it — so a decision taken months ago can still be explained (ADR 0004, task 016).

The invoice arrives with nothing but a document and a status of `received`; receiving it is task
015, reading it task 016, deciding about it task 017, and showing it task 018.
