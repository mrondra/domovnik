# invoices/schema

The tables of this feature, split by what they are about so no file outgrows the hundred-line limit.
`../schema.ts` re-exports this directory, because `packages/db` composes the migration schema from
`packages/features/*/schema.ts` and its glob does not look inside a directory (task 014).

| File           | Tables                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| `suppliers.ts` | `supplier` — tenant-wide, one per IČO — and the `contract` of one SVJ  |
| `budget.ts`    | `budget_line` — what one SVJ planned to spend in one year per category |
| `invoices.ts`  | `invoice` with its status enum, and `invoice_line`                     |

**The rule:** a supplier is tenant-scoped and everything else is SVJ-scoped. The same lift service
invoices several houses, and the address book is one thing the management company keeps (zadání
kap. 4); what that supplier agreed with a given SVJ, and what it billed them, belongs to that SVJ.
