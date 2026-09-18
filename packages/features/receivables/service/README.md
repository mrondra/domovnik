# receivables/service

What the rest of the platform calls. Every method here goes through an adapter for the data itself
and adds what is the same whichever adapter answered: the audit row and the domain event.

| File                     | Contents                                                         |
| ------------------------ | ---------------------------------------------------------------- |
| `receivables.service.ts` | `ReceivablesService`, the injectable face; it only delegates     |
| `prescriptions.ts`       | raising a month of prescriptions, and reading them back          |
| `balance.ts`             | the ledger of one unit, and the debtors of one SVJ               |
| `payments.ts`            | `recordPayment` — the audited half of money arriving             |
| `vs.ts`                  | the variable symbol: the sequence it starts from, and one unit's |

**The rule:** an SVJ the actor may not reach answers `NotFoundError`, never `ForbiddenError` —
whether it exists is itself something they may not learn (zadání kap. 9). The check lives here and
not in an adapter, so every implementation is behind the same door.

A mutation writes its audit row and emits its event in the same transaction as the
change, so neither can outlive a rollback (docs/engineering.md §5). An adapter never does either —
it is a data source, and the Pohoda one (phase 2) has nothing to audit on our side.

`vs.ts` sits above the adapters on purpose, and `adapters/internal/generate.ts` reaches up for it:
the six digits a payer copies have to be the same whichever implementation raised the prescription,
so they cannot be decided inside one of them.
