# @domovnik/db

The composition layer over the database: it assembles the Drizzle schema from the kernel and every
feature, generates and runs migrations, and holds the seed runner.

| File / directory    | Contents                                                                          |
| ------------------- | --------------------------------------------------------------------------------- |
| `drizzle.config.ts` | what Drizzle Kit reads: the composed schema in, `drizzle/` out                    |
| `drizzle/`          | generated migrations, committed and never edited afterwards                       |
| `src/schema.ts`     | **generated** — the kernel schema plus every `features/*/schema.ts`               |
| `src/compose.ts`    | writes `src/schema.ts` from what is on disk                                       |
| `src/generate.ts`   | `pnpm db:generate`: compose → Drizzle Kit → decorate                              |
| `src/decorate.ts`   | appends the RLS policies and `CREATE EXTENSION vector` to a fresh migration       |
| `src/migrate.ts`    | `pnpm db:migrate`: Drizzle's migration reader applied through `withSystem`        |
| `src/ledger.ts`     | `drizzle.__drizzle_migrations`, the same bookkeeping Drizzle's own migrator keeps |
| `src/audit-rls.ts`  | asks the catalogue which `tenant_id` tables lack RLS                              |
| `src/seed/`         | `pnpm db:seed`: the demo tenant, then the feature seeds in dependency order       |
| `src/bin/`          | the three entry points the package scripts run                                    |

## Adding a table

Declare it in the owning feature's `schema.ts` through `tenantTable()` or `svjTable()`, then run
`pnpm db:generate`. The generator re-composes `src/schema.ts`, lets Drizzle Kit diff it and appends
the policies for the tables the migration creates. Commit both the migration and `src/schema.ts`.

A table created any other way — a raw `pgTable`, or DDL written by hand — is not in the registry and
gets no policy. `tablesWithoutRls()` reads that back out of `pg_class`/`pg_policies` and the
integration test fails on it, so the gap surfaces in CI rather than in production (ADR 0003).

**The rule:** `packages/db` is the only place besides the kernel allowed to touch tables of more
than one feature, and even then only for migrations and seed. A business query across features goes
through the other feature's service or through an event, never through the database.
