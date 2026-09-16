# @domovnik/workers

Everything that happens without somebody waiting for an answer: the outbox reaches its subscribers,
agents run, time turns into events, and an approved action is actually carried out. It holds no
business logic — the handlers belong to the kernel and to the features, and this app decides only
when they run and how many at once (AGENTS.md §2).

| Directory / file         | Contents                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| `src/main.ts`            | the process: env, a standalone Nest context, shutdown hooks       |
| `src/workers.module.ts`  | composition — one provider                                        |
| `src/workers.service.ts` | the lifecycle: start the runtime and the health server, stop both |
| `src/health.ts`          | `GET /health` on port 3002, including a database ping             |
| `src/runtime/`           | the runtime itself; see its own README                            |
| `src/tests/`             | unit tests of the limits, integration tests over a real Postgres  |

## Delivery is at-least-once, and that is a contract

`events.emit` writes the event and its outbox row inside the caller's transaction. The relay polls
that outbox and sends one job per subscription, with a job id derived from `eventId` and the queue
name — so pg-boss rejects the duplicate a crashed relay would otherwise produce. What it cannot rule
out is a handler that ran, succeeded, and died before the job was acknowledged.

**Every event handler therefore has to be idempotent.** Where that costs something, the handler
records that it ran: `approval-resume` writes `executed_at` with the result in one transaction, so a
redelivered decision finds the action already done (ADR 0015).

## Which queues exist

One per subscription, named `<event>/<subscriber>`, created at startup. A feature handler is
`<event>/<its subscriber name>`; an agent is `<event>/agent.<agent name>`. That is also the
idempotency key, which is why a subscriber name is not something to rename casually — a new name is
a new queue and the jobs in the old one have nobody to take them.

## Running it

`pnpm dev` runs it under `tsx`, and so does `pnpm start`. There is no bundle step here on purpose:
feature tools, subscribers and agents are discovered by directory convention at startup (zadání §6.1),
which means
importing TypeScript sources at run time — something a self-contained bundle cannot do. The deployed
image ships the workspace and runs the TypeScript loader, exactly as `packages/db` does for its
migrations and seed.
