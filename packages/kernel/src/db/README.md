# db

The only way to the database. Neither the Drizzle client nor the pool leaves this module — only
`withTenant`, `withSystem` and `closeConnections` do.

| File / directory | Contents                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `client.ts`      | two pools: the application one (RLS applies) and the owner one (migrations, seed, `withSystem`) |
| `tenant.ts`      | `withTenant`, `withSystem`, `currentTransaction`                                                |
| `table.ts`       | `tenantTable`, `svjTable`, `rlsPoliciesSql`, the table registry                                 |
| `admin.ts`       | DDL the ORM does not express: extensions, roles, grants, policies                               |
| `schema/`        | the tables the kernel owns                                                                      |

`withTenant(ctx, fn)` opens a transaction, writes `app.tenant_id`, `app.actor_id` and
`app.actor_type` into it, and rolls back on any error. A nested call with the same tenant reuses the
open transaction, so one service can call another without losing atomicity; a nested call with a
**different** tenant is an error.

`withSystem({ reason }, fn)` is the only route to data without RLS — for migrations, seed and
cross-tenant jobs. It demands a reason and logs a warning.

`pingDatabase()` runs `select 1` on the application pool; it is what `GET /health` reports and says
nothing about any tenant.

`closeConnections()` ends both pools. A long-running app never calls it; a CLI (`pnpm db:migrate`,
`pnpm db:seed`) has to, or the process hangs on an open pool.

**The rule:** every table with a `tenant_id` is created through `tenantTable()`, because that is
what guarantees it an RLS policy (ADR 0003). The policy reads `current_setting('app.tenant_id')`
without `missing_ok`, so a query outside `withTenant` fails loudly instead of returning zero rows.
A new table does not merge without an isolation test.
