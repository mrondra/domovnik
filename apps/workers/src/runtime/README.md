# runtime

Everything the worker process does between `start` and `stop`. The business logic lives in the
kernel and in the features; what is here is the wiring that decides **who runs what, when, and how
many at once**.

| File                     | Responsibility                                                                |
| ------------------------ | ----------------------------------------------------------------------------- |
| `start.ts`               | composes the whole runtime and hands back one `stop()`                        |
| `registry.ts`            | loads feature tools, subscribers and agents by directory convention           |
| `agent-subscriptions.ts` | turns every agent trigger into an event subscription                          |
| `agent-runner.ts`        | the only place an agent is started; applies the per-agent/per-tenant limits   |
| `limiter.ts`             | the concurrency gate those limits are made of                                 |
| `relay.ts`               | the loop that moves the outbox onto the queue                                 |
| `scheduler.ts`           | the cron side: ticks and an agent's own `schedule`                            |
| `scheduled-agents.ts`    | fan-out of one cron firing into one run per tenant                            |
| `ticks.ts`               | `tick.daily` / `tick.monthly` as real events, plus expiring overdue approvals |

## Order matters at startup

A queue is created per subscription, so **every subscription must be registered before the queue
opens**. `start.ts` therefore loads the registry, subscribes the agents and the approval resume, and
only then calls `startEventWorkers`. An agent that registers later has a subscription nobody drains.

The registry is what makes a feature's plain handlers part of that: a file in
`packages/features/*/subscribers/` calls `subscribe()` as it is imported, and from there on it is
the same subscription an agent trigger is — one queue, the same retry policy, the same idempotency.

## Where the limits actually live

pg-boss counts concurrency per queue. The limits in zadání §6.1 are per agent and per tenant, and a
tenant's runs are spread across every agent's queue, so the queue cannot enforce them. The split:

- `localConcurrency` on the queue decides how many jobs this node **pulls** for one agent,
- `createGate` decides how many of them **proceed**, keyed by agent and by tenant.

The gate is in-process, so the limits are per node. A second workers instance doubles them — which
is the point at which this belongs in the database instead.

## Why time is an event

A cron fires once for the whole installation, but every consumer downstream reads data through
`withTenant`. So the scheduler does not run work directly: it emits `tick.daily` / `tick.monthly`
**per tenant** and lets the ordinary subscription path take over (zadání §5). An agent that has to
run nightly subscribes to a tick; `schedule` in an agent definition exists for the case where it
needs a rhythm of its own, and fans out the same way.
