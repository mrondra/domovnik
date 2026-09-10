# audit

`audit_log`: every mutation with its actor and its reason.

| File        | Contents                                                           |
| ----------- | ------------------------------------------------------------------ |
| `record.ts` | `record(ctx, { action, entity, entityId, reason, before, after })` |

The row carries `actorType`, `actorId`, `correlationId` and `agentRunId` from the context, so an
agent run is traceable from the audit log too, not only from `agent_run`.

**The rule:** the service records explicitly, rather than a Drizzle hook doing it (ADR 0011) —
`reason` is knowledge only the caller has. A call outside `withTenant` is an error, so an audit row
cannot outlive a rollback of the mutation it describes.
