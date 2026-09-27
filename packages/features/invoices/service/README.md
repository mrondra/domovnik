# invoices/service

The only place in this feature that writes. Controllers, tools, agents and the seed all come here.

| File                   | Contents                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `invoices.service.ts`  | `InvoicesService`, the injectable face `apps/api` wires up; it delegates |
| `budget.ts`            | the planned line, and what is left of it once invoices are approved      |
| `invoice-records.ts`   | an invoice arriving, and reading one or many back                        |
| `transitions.ts`       | the one way an invoice moves from one status to the next                 |
| `transition-events.ts` | which steps are announced, and what a step has to know before it is      |
| `reach.ts`             | the access question every call naming an SVJ asks first                  |
| `rows.ts`              | Drizzle row → domain type, and the `numeric` conversion back             |

**The rule:** every step goes through `transition`. It checks `TRANSITIONS` before it writes, so no
controller, tool or agent can invent a shortcut, and the audit row and the event are written in the
same transaction as the change — a refused step leaves no trace, an accepted one leaves both.

A supplier and a contract are `packages/features/suppliers`' tables, not this feature's (task 029):
`findSupplierByIco`/`findContractsForSupplier` reach them through `suppliers/index`, same as any
other caller.

`approved` and `posted` refuse to happen while the invoice is missing what the event they raise has
to carry — who is to be paid, how much, by when, and under which Pohoda id. An approved invoice
nobody can pay is worse than a step that failed.
