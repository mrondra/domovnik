# suppliers

The address book of the management company (`supplier`), and what one SVJ agreed to pay a supplier
for (`contract`). Moved out of `invoices` (task 029, ADR 0023) so `inspections` and `quotes` can use
the same address book without depending on the whole invoices feature.

| File / directory | Contents                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `schema.ts`      | `supplier` (tenant-wide, one per IČO) and `contract` (one SVJ) tables                                    |
| `domain/`        | `Supplier`, `Contract`, `BudgetCategory`, their ids and zod schemas                                      |
| `service/`       | the only place that mutates; `reach.ts` guards SVJ-scoped reads/writes                                   |
| `api/`           | `GET /suppliers`, `GET /suppliers/:id`, `PATCH /suppliers/:id`, `GET /svj/:svjId/contracts`              |
| `tools/`         | `suppliers.search`, `suppliers.get`, `suppliers.contractFor` — read-only, `permission: 'suppliers.read'` |
| `seed/`          | the demo address book and the contracts of the three demo SVJ                                            |
| `ui/`            | `SupplierListScreen`, `SupplierDetailScreen`, and what `apps/web` composes them from                     |
| `tests/`         | unit/service tests plus the RLS isolation test for both tables                                           |
| `index.ts`       | the public face: what `invoices` and every later feature may import                                      |

**The rule:** a supplier is tenant-scoped and a contract is SVJ-scoped — the same lift service
invoices several houses, and the address book is one thing the management company keeps (zadání
kap. 4); what that supplier agreed with a given SVJ belongs to that SVJ. `invoices` and
`accounting-sync` reach this feature through `index.ts`, never the other way around, and nothing
outside `seed/` may import another feature — enforced by `suppliers-knows-no-feature` in
`.dependency-cruiser.cjs`, not just claimed here. The one exception is the seed itself: it reads
`svj`'s read model (`readModels.svjSummary`/`svjSequence`) to know which demo house is which, the
same pattern `receivables`, `payments`, `invoices` and `accounting-sync` use for their own seeds
(ADR 0024).
