# testing

Test helpers. A separate entry point (`@domovnik/kernel/testing`) so that production code cannot
reach them.

| File / directory | Contents                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| `env.ts`         | `applyTestEnv` — the only place outside `env/` that writes `process.env`     |
| `database.ts`    | `startTestDb` — a database and an application role per test file             |
| `storage.ts`     | `startTestStorage` — a bucket per test file on a running or started MinIO    |
| `tenant.ts`      | `withTestTenant` — a tenant with one `tenant_admin`                          |
| `agent.ts`       | `runAgentInTest` — an agent run against a fixture                            |
| `replay/`        | the local endpoint serving recorded model answers                            |
| `sse.ts`         | assembling an SSE stream from a fixture message                              |
| `contract.ts`    | `describeAdapterContract` — one suite for both the mock and the real adapter |

`startTestDb(featureSchema?)` pushes the kernel schema plus whatever tables the caller passes in, so
a feature's integration test provisions its own tables without `packages/db`. It uses `DATABASE_URL`
when a Postgres is running (docker compose, the CI service) and starts a testcontainer otherwise. Either way it creates a **new database and a new application
role** — Postgres does not enforce RLS against a superuser or against the table owner, so an
isolation test connected as the owner would pass without proving anything (ADR 0013).

`startTestStorage()` uses the S3 the process environment already points at (`S3_ENDPOINT` with
`S3_ACCESS_KEY` and `S3_SECRET_KEY`, e.g. docker compose) and starts a MinIO testcontainer
otherwise. Either way it creates a **new bucket with a random suffix**, writes its name to
`S3_BUCKET`, points the other `S3_*` variables at the chosen endpoint and drops the memoised S3
client. On `stop()` it empties and deletes that bucket; a running MinIO is left running and a bucket
that came from the environment is never deleted. There is no RLS in object storage, so what the
storage tests prove is the key prefix — `putObject` on another tenant's key is a `ForbiddenError`.

**The rule:** an integration test asks for its database, it does not assume one. Shared setup (an
agent definition, a mock tool) belongs in a `*.fixture.ts` next to the test.
