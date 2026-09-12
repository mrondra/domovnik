# @domovnik/kernel

The one horizontal layer. Everything every feature needs: identity, request context, the database
with RLS, events, approvals, audit, the tool and agent registries, the agent runtime, the LLM
client, errors, logging, environment and test helpers.

**The kernel knows no feature.** The dependency runs one way only: feature → kernel.

Scope: `docs/tasks/001-kernel.md`. Decisions: ADR 0003, 0004, 0006, 0007, 0008, 0011, 0012, 0013.

## Map

| Directory    | What it is for                                                                |
| ------------ | ----------------------------------------------------------------------------- |
| `env/`       | configuration; the only reader of `process.env`                               |
| `errors/`    | the error taxonomy and how it maps to HTTP and to a tool result               |
| `logger/`    | pino, redaction of secrets and personal data, a logger bound to the context   |
| `ids/`       | branded identifiers (uuid v7)                                                 |
| `context/`   | `RequestContext` (tenant, actor, correlation) and how it is carried           |
| `db/`        | the only way to the database: `withTenant`, `withSystem`, RLS, kernel tables  |
| `identity/`  | tenants, users, roles and permissions, sessions, API tokens, agent identities |
| `audit/`     | `audit_log` — every mutation with its actor and its reason                    |
| `approvals/` | approval as an entity; the deferred run of a tool handler                     |
| `events/`    | typed events, the transactional outbox, delivery through pg-boss              |
| `tools/`     | the capability registry: `defineTool`, `executeTool`                          |
| `agents/`    | declarative agent definitions and the runtime that executes them              |
| `seed/`      | the contract a feature's demo data implements; the runner lives in `db`       |
| `llm/`       | direct model calls outside the agent loop, with record/replay                 |
| `testing/`   | test helpers; a separate entry point, `@domovnik/kernel/testing`              |

`discovery.ts` at the root loads tools, agents and seeds by directory convention; all three
registries use it.

## The four invariants this package exists for

1. **Nothing reaches the database outside `withTenant`.** The policy reads `app.tenant_id`, and a
   query without it fails loudly instead of returning no rows (ADR 0003, 0013).
2. **An event is born only inside the transaction that caused it.** `events.emit` outside
   `withTenant` is an error, and the writes to `event` and `event_outbox` are atomic with the
   mutation.
3. **A tool with an approval policy never runs its handler directly.** The runtime creates an
   `Approval` and the handler runs after the decision — exactly once (ADR 0006).
4. **An agent gets no tool outside its definition and none outside its autonomy.** The runtime
   enforces it, not the prompt (ADR 0008, 0012).

## Where to add what

| I want to add…          | Where it goes                                                    |
| ----------------------- | ---------------------------------------------------------------- |
| an environment variable | `env/schema.ts` and `.env.example`                               |
| an error type           | `errors/taxonomy.ts` plus its mapping in `errors/http.ts`        |
| a kernel table          | `db/schema/` through `tenantTable()`, plus an RLS isolation test |
| a branded id            | `ids/identifiers.ts`                                             |
| a kernel event          | `defineEvent` in the module that emits it                        |
| a tool, agent or seed   | into a feature, not here — the kernel only holds the registry    |
