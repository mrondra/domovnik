# invoices

Incoming invoices and what they are matched against: the address book of suppliers and the
contracts an SVJ has with them (`packages/features/suppliers`, ADR 0023), and the budget the
spending is counted towards. Pohoda stays the source of truth for the accounting itself (ADR 0005);
what lives here is the process in front of it.

| File / directory | Contents                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `schema.ts`      | re-exports `schema/`, which is where the three tables actually live            |
| `domain/`        | the types, the zod shapes, the six events and the status machine               |
| `service/`       | the only place that writes; every step audited, the five that matter announced |
| `api/`           | the Nest module `apps/api` discovers                                           |
| `tests/`         | the RLS isolation tests, the machine's own table test, and the service tests   |
| `index.ts`       | the public face: what other features and apps may import                       |

**The rule:** everything outside this directory sees the feature through `index.ts` only. Reach
another feature through its `index.ts` or an event, never through its tables (docs/engineering.md §2).

Three decisions worth knowing before changing anything here:

- An invoice only ever moves through `transition`, which checks `domain/status.ts` first. The status
  is the machine's and not the caller's, so a controller, a tool and an agent all get the same
  answer to "may this happen now?".
- A supplier and a contract live in `packages/features/suppliers`, reached only through its
  `index.ts` (task 029, ADR 0023/0024): the same lift service invoices several houses, and
  `inspections`/`quotes` need the same address book without depending on this whole feature.
- `extraction` and `checks` are kept as they were — what the model read, and what the deterministic
  rules made of it — so a decision taken months ago can still be explained (ADR 0004, task 016).

The invoice arrives with nothing but a document and a status of `received`; receiving it is task
015, reading it task 016, deciding about it task 017, and showing it task 018.

**One thing the demo does on purpose that production need not.** `finance.invoice.extracted` is
raised for every invoice that got through the checks, including the ones with `warnings: []`, and
the agent (task 017) is given all of them. That is because what the agent produces is the summary
the committee reads, not the decision — the decision is already made by the rules in
`service/checks/`. In production an invoice with no warnings could go straight to an approval
without a model ever seeing it, and only the ones with something to explain would need one.
