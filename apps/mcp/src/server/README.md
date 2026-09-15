# server

The MCP surface of the tool registry: what a connected client may see and call. Nothing here decides
anything a REST call would decide differently — `executeTool` is the same entry point (zadání §6.2),
so a tool behaves identically whether a person, an agent or a model asks for it.

| File               | Responsibility                                                    |
| ------------------ | ----------------------------------------------------------------- |
| `principal.ts`     | bearer token → tenant, actor and the tool subset the token allows |
| `create-server.ts` | one `McpServer` per connection, built from that principal         |
| `tools.ts`         | `tools/list` and `tools/call`, including the approval answer      |
| `resources.ts`     | `approvals://inbox` and `svj://list`                              |

## The token narrows, it never grants

The actor is the token's **owner**. Roles are read fresh on every request, and the visible tool set
is `token.allowedTools ∩ what the owner may do now`. Losing a role therefore shrinks every token that
person holds, with nothing to revoke and no session to expire (zadání kap. 9).

Only the permitted tools are registered on the server at all. A tool outside the token is not
refused on call — it is absent from `tools/list` and unknown to that connection, which is the same
answer a client would get for a tool that does not exist.

## An approval is an answer

A tool whose policy returns `required` never runs its handler here either (ADR 0006). The call comes
back as `pending_approval` with the approval id and a sentence saying what happens next, so the model
learns the action was proposed rather than that something failed — and the workers carry it out once
somebody decides (ADR 0015).

## Names on the wire

`invoice.extract` is exposed as `invoice_extract`: MCP tool names are `[A-Za-z0-9_-]`. The conversion
lives in the kernel (`tools/mcp.ts`) and is shared with the agent runtime, so a tool has one wire name
rather than one per surface.
