# agents/store

Persistence for the agent registry.

| File             | Contents                                                                    |
| ---------------- | --------------------------------------------------------------------------- |
| `overrides.ts`   | `loadOverrides` — the per-tenant and per-SVJ override of autonomy and model |
| `definitions.ts` | `upsertAgentDefinition` — storing a definition in `agent_definition`        |
| `runs.ts`        | `startAgentRun`, `finishAgentRun`                                           |

**The rule:** a version of a definition is immutable. For a given name and version
`upsertAgentDefinition` either finds the existing row or inserts a new one — it never overwrites. An
`agent_run` therefore always points at exactly the definition it ran with (ADR 0008).

Switching an agent off is configuration (`agent_config.is_enabled`), not deletion. A row for a
specific SVJ wins over a row for the whole tenant.
