# receivables/adapters/internal

The `ReceivablesAdapter` for a management company that keeps prescriptions and balances here rather
than in an accounting system — the default, and the only one phase 1 needs (ADR 0005, zadání kap. 8).

| File               | Contents                                                             |
| ------------------ | -------------------------------------------------------------------- |
| `generate.ts`      | `generatePrescriptions` — units + plan → a month of prescriptions    |
| `prescriptions.ts` | reading prescriptions: by period, and by variable symbol             |
| `balance.ts`       | the ledger of one unit, and the debtors of one SVJ                   |
| `payments.ts`      | `recordPayment` — one more line in the ledger                        |
| `rows.ts`          | Drizzle row → domain type, and the `numeric`/`date` conversions back |
| `index.ts`         | the adapter object, which is what `adapters/index.ts` hands out      |

**The rule:** nothing imports this directory except `adapters/index.ts`. A caller that names an
implementation has decided for an SVJ what `accounting_link` decides, and the choice is per SVJ.
`feature-via-index-only` in `.dependency-cruiser.cjs` guards the feature from outside, not its own
inside, so this one is on the reader.

The audit rows and the events belong to `service/`, not here: an adapter is a data source, and the
Pohoda one (phase 2) records neither.
