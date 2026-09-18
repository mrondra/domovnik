# receivables

What the owners of one SVJ are asked to pay each month, and what they have paid. Pohoda has no SVJ
module and every management company keeps this differently, so the data itself lives behind the
`ReceivablesAdapter` port (ADR 0005); this feature owns the port, our own implementation of it, and
the audited service in front of both.

| File / directory | Contents                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| `schema.ts`      | `prescription`, `prescription_item`, `unit_balance_entry` — via `svjTable` |
| `domain/`        | the types, the accounting month, the plan arithmetic, the variable symbol  |
| `adapters/`      | the port and the choice of implementation; `internal/` is our own records  |
| `service/`       | what the platform calls; every mutation audited, every one an event        |
| `api/`           | the Nest module `apps/api` discovers; no controller before task 013        |
| `tests/`         | the RLS isolation tests, the unit tests and the tests over a real Postgres |
| `index.ts`       | the public face: what other features and apps may import                   |

**The rule:** everything outside this directory sees the feature through `index.ts` only. Reach
another feature through its `index.ts` or an event, never through its tables (docs/engineering.md §2).

Four decisions worth knowing before changing anything here:

- A prescription is written for a **unit**, not for an owner. Who owns a flat changes, the unit does
  not, and the payer is recognised by the variable symbol. Owners arrive in phase 3 and this schema
  does not move (task 012).
- The variable symbol is `<pořadí SVJ na 2><číslo jednotky na 4>`, decided in `service/vs.ts` above
  the adapters, and then stored on the prescription — a symbol once issued never changes again.
- The balance is a ledger, not a column: a prescription is a negative entry, a payment a positive
  one, and the balance is their sum. Nothing is updated in place, so a statement always adds up.
- Every SVJ is on the `internal` adapter until task 024 creates `accounting_link`.
  `adapters/README.md` says where that choice will come from.
