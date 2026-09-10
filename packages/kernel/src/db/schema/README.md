# db/schema

The tables the kernel owns. A feature keeps its own tables in its `schema.ts`; `packages/db` then
composes them all.

| File              | Tables                                                            |
| ----------------- | ----------------------------------------------------------------- |
| `enums.ts`        | the pgEnum types shared between tables                            |
| `organisation.ts` | `tenant`, `user`, `user_role`                                     |
| `access.ts`       | `session`, `api_token`                                            |
| `agents.ts`       | `agent_identity`, `agent_definition`, `agent_config`, `agent_run` |
| `events.ts`       | `event`, `event_outbox`                                           |
| `governance.ts`   | `approval`, `audit_log`                                           |

`tenant` has a `tenant_id` equal to its own `id`, so that one policy shape fits every table. Its
first row is therefore written through `withSystem`.
