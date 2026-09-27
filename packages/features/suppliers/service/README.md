# suppliers/service

The only place in this feature that writes. `invoices` and `apps/api` both come here through
`SuppliersService` or the plain functions it delegates to.

| File                   | Contents                                                        |
| ---------------------- | --------------------------------------------------------------- |
| `suppliers.service.ts` | `SuppliersService`, the injectable face `apps/api` wires up     |
| `suppliers.ts`         | the address book of the management company, keyed by IČO        |
| `contracts.ts`         | what an SVJ agreed with a supplier, and which applied on a day  |
| `contract-queries.ts`  | one contract by id, and every contract of an SVJ in force today |
| `reach.ts`             | the access question every call naming an SVJ asks first         |
| `rows.ts`              | Drizzle row → domain type, and the `numeric` conversion back    |

**The rule:** a supplier is the one thing here that is not SVJ-scoped and so asks no reach question:
the same lift service invoices several houses, and the address book is one (zadání kap. 4). A
contract always does, because it is what one SVJ agreed — `assertReachable` runs before any write
or read that names one.
