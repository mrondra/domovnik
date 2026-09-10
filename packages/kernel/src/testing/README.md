# testing

Test helpers. A separate entry point (`@domovnik/kernel/testing`) so that production code cannot
reach them.

| File / directory | Contents                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| `env.ts`         | `applyTestEnv` — the only place outside `env/` that writes `process.env`     |
| `database.ts`    | `startTestDb` — a database and an application role per test file             |
| `tenant.ts`      | `withTestTenant` — a tenant with one `tenant_admin`                          |
| `agent.ts`       | `runAgentInTest` — an agent run against a fixture                            |
| `replay/`        | the local endpoint serving recorded model answers                            |
| `sse.ts`         | assembling an SSE stream from a fixture message                              |
| `contract.ts`    | `describeAdapterContract` — one suite for both the mock and the real adapter |

`startTestDb()` uses `DATABASE_URL` when a Postgres is running (docker compose, the CI service) and
starts a testcontainer otherwise. Either way it creates a **new database and a new application
role** — Postgres does not enforce RLS against a superuser or against the table owner, so an
isolation test connected as the owner would pass without proving anything (ADR 0013).

**The rule:** an integration test asks for its database, it does not assume one. Shared setup (an
agent definition, a mock tool) belongs in a `*.fixture.ts` next to the test.
