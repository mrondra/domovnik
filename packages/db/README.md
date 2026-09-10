# @domovnik/db

The composition layer over the database: it assembles the Drizzle schema from every feature,
generates and runs migrations, and holds the seed runner.

Only a skeleton so far — the contents arrive with task 003 (`docs/tasks/003-db.md`).

**The rule:** `packages/db` is the only place besides the kernel allowed to touch tables of more
than one feature, and even then only for migrations and seed. A business query across features goes
through the other feature's service or through an event, never through the database.
