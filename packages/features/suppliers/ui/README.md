# suppliers/ui

The address book as a person reads it: who does what, how to reach them, and what each SVJ has
actually agreed with them.

| File                       | Contents                                                        |
| -------------------------- | --------------------------------------------------------------- |
| `SupplierListScreen.tsx`   | every dodavatel, filtered by obor                               |
| `SupplierDetailScreen.tsx` | one dodavatel's obory, contact, and contracts — grouped per SVJ |
| `labels.ts`                | Czech for every obor (task 030 subtask 1)                       |
| `navigation.ts`, `wire.ts` | what the shell composes and what data arrives as                |

**The rule:** nothing here fetches. `apps/web/src/api/suppliers.ts` reads `GET /suppliers`,
`GET /suppliers/:id` and, for every SVJ the actor may reach, `GET /svj/:svjId/contracts` — no single
endpoint answers "this supplier's contracts across every SVJ I may see", so the page composes it
(`wire.ts#supplierDetailView`). A contract belongs to one SVJ; `SupplierDetailScreen` never merges
two SVJ's contracts into one row, the same boundary `suppliers.get` (`../tools/get.ts`) keeps for a
committee member reading through an agent.

Founding a contract or rating a supplier is out of scope (zadání kap. "Mimo rozsah"): the detail
screen only shows what already exists.
