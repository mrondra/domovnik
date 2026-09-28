# invoices/schema

The tables of this feature, split by what they are about so no file outgrows the hundred-line limit.
`../schema.ts` re-exports this directory, because `packages/db` composes the migration schema from
`packages/features/*/schema.ts` and its glob does not look inside a directory (task 014).

| File          | Tables                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| `budget.ts`   | `budget_line` — what one SVJ planned to spend in one year per category |
| `invoices.ts` | `invoice` with its status enum, and `invoice_line`                     |

`invoice.supplierId`/`invoice.contractId` name who sent it and under which contract it was booked;
the tables they point at moved out (`../README.md`, ADR 0023/0024).
