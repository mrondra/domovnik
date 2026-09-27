# invoices/schema

The tables of this feature, split by what they are about so no file outgrows the hundred-line limit.
`../schema.ts` re-exports this directory, because `packages/db` composes the migration schema from
`packages/features/*/schema.ts` and its glob does not look inside a directory (task 014).

| File          | Tables                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| `budget.ts`   | `budget_line` — what one SVJ planned to spend in one year per category |
| `invoices.ts` | `invoice` with its status enum, and `invoice_line`                     |

`supplier` and `contract` moved to `packages/features/suppliers` (task 029, ADR 0023): a supplier
belongs to the management company, not to one SVJ or one feature, and `inspections`/`quotes` need
the same address book without depending on invoices. `invoice.supplierId`/`invoice.contractId`
stay here — an invoice still names who sent it and under which contract it was booked.
