# agents/runtime

One run of one agent on the Claude Agent SDK (ADR 0012).

| File               | Contents                                                                         |
| ------------------ | -------------------------------------------------------------------------------- |
| `types.ts`         | `AgentTrigger`, `AgentRunOptions`, `AgentRunResult`, `RunOutcome`                |
| `tool-bridge.ts`   | the translation of the tool registry into an in-process MCP server               |
| `session.ts`       | the conversation with the harness: isolated `cwd`, `Options`, the `query()` loop |
| `outcome.ts`       | the three shapes a run ends in: the SDK's answer, budget exceeded, no result     |
| `run-agent.ts`     | orchestration: configuration → `agent_run` → session → recorded result           |
| `agent.fixture.ts` | shared setup for the integration tests                                           |

What the runtime enforces:

- **the tool set** is the definition's tools ∩ the agent identity's permissions ∩ autonomy;
- **`cwd`** is a fresh empty directory per run. Otherwise the harness reads `CLAUDE.md`, the user's
  memory and environment reminders out of its working directory — one tenant's agent run would see
  whatever happens to sit on the server's disk;
- **the token budget** is checked after every message; exceeding it ends the run as `failed_budget`
  and emits `agent.run.failed`;
- **a failing tool** is handed back to the model as an `isError` result, not raised as a failed run.

Tool names take an underscore across the MCP boundary (`invoice.extract` → `invoice_extract`),
because MCP does not allow a dot in a name.

Tests run in replay mode: `ANTHROPIC_BASE_URL` points at the local endpoint from `testing/replay`,
so a real subprocess and the real tool loop both run, without the network.
