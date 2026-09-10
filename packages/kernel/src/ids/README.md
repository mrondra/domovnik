# ids

Branded identifiers. `TenantId` and `SvjId` are both uuid strings at runtime, but the type system
keeps them apart — mixing up two ids is the cheapest mistake there is to catch at compile time.

| File             | Contents                                                                              |
| ---------------- | ------------------------------------------------------------------------------------- |
| `brand.ts`       | `brand(name)` (schema plus brand), `newId(schema)`, `newRowId()`                      |
| `identifiers.ts` | the kernel's own ids: tenant, svj, user, agent, agent run, event, approval, api token |

A feature mints its own id with `brand('InvoiceId')` next to its code; only the ones the kernel
knows about live here.

**The rule:** primary keys are uuid **v7** — they are time-ordered, so the index does not grow at
random. `newRowId()` is for rows whose identity nobody refers to across a module boundary.
