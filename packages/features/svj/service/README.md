# svj/service

The only place in this feature that reads and writes the database. Controllers, tools, the seed and
the tests all come through here.

| File              | Contents                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| `svj.service.ts`  | `SvjService`, the injectable face `apps/api` wires up; it only delegates    |
| `svj-records.ts`  | creating an SVJ and reading one by id                                       |
| `svj-updates.ts`  | changing the SVJ record — audited, no event; it is reference data           |
| `summaries.ts`    | `listForActor` and the `svjSummary` read model other features may use       |
| `buildings.ts`    | buildings of an SVJ                                                         |
| `units.ts`        | creating and changing a unit; the two places that emit and audit            |
| `unit-queries.ts` | reading units, one unit, and `getShareOfUnit`                               |
| `departments.ts`  | departments of the management company — tenant-scoped, not SVJ-scoped       |
| `reach.ts`        | `reachable` / `reachableIds` — the access question every read asks first    |
| `rows.ts`         | Drizzle row → domain type, including the branded ids and the share fraction |

**The rule:** every read that can name an SVJ asks `reach.ts` first, and an SVJ the actor may not
reach answers `NotFoundError`, never `ForbiddenError` — whether it exists is itself something they
may not learn (zadání kap. 9). The narrowing itself lives in the kernel (`reachableSvj`, ADR 0016),
so it is the same answer for REST, MCP and agents.
