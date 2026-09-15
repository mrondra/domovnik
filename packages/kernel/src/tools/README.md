# tools

The capability registry. One tool serves the REST API, the MCP server and agents alike — whatever
the UI can do, an agent can do (zadání §2.4).

| File / directory | Contents                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `definition.ts`  | the `ToolDefinition` shape: zod input and output, `permission`, `approval`, `readOnly`, `userComposable` |
| `registry/`      | the registry itself                                                                                      |
| `execute.ts`     | `executeTool(ctx, name, input)` — the single entry point for a call                                      |
| `mcp.ts`         | the wire form of a tool: its MCP name and its argument shape                                             |

`description` is written for the model: what the tool does, when to use it and what it returns.

**The rule:** `executeTool` checks the permission, validates the input and evaluates
`approval(ctx, input)`. When the policy returns `required`, **the handler does not run** — an
`Approval` is created and the caller gets back `{ status: 'pending_approval', approvalId }`. An
agent cannot route around it, because it has no other way to reach a tool (ADR 0006). Every tool
that can return `required` carries a mandatory test that the handler stayed unexecuted.

Both MCP surfaces — the server in `apps/mcp` and the one the agent runtime builds for the harness —
go through `mcp.ts`, so a tool is called `invoice_extract` in exactly one way rather than two.
