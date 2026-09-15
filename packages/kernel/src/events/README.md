# events

Typed events: domain ones (audit and integrations) and agent ones (the batched residual an agent
reacts to, ADR 0004).

| File            | Contents                                                         |
| --------------- | ---------------------------------------------------------------- |
| `definition.ts` | `defineEvent(name, schema)` — name, version and payload schema   |
| `emit.ts`       | `emit(ctx, envelope)` — the writes to `event` and `event_outbox` |
| `subscribe.ts`  | the subscription registry, queue naming, delivery context        |
| `relay.ts`      | outbox → queue, with a deterministic job id                      |
| `queue.ts`      | the pg-boss adapter and the agent runtime limits                 |

Names follow `domain.entity.action`; domain events use the past tense
(`finance.invoice.received`), agent events name a state (`finance.transactions.unmatched`).

**The rule:** `emit` must run inside `withTenant`, and it writes the event and its outbox row into
**the same transaction** as the mutation that caused it — so an event cannot outlive a rollback.
Delivery is at-least-once; repeated work is cut off by a job id derived from
`(queue, idempotencyKey)`, which pg-boss refuses to insert twice.

There is one queue per event-and-subscriber pair, named `<event>/<subscriber>`
(`finance.invoice.received/agent.invoice-processor`). The separator and the check on it are not
cosmetic: pg-boss rejects a queue name outside `[A-Za-z0-9_-./]`, and a subscriber whose name cannot
become a queue would otherwise fail at startup instead of at the point that named it.
