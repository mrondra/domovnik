# @domovnik/mcp

The MCP server: Domovník's tools and read models exposed to a model the user brings along — Claude
Desktop, an editor, anything that speaks MCP. Authentication is an API token the user issued in the
web app (zadání kap. 9). It holds no business logic; tools come from the registry and are executed
through the kernel.

| Directory / file | Contents                                                       |
| ---------------- | -------------------------------------------------------------- |
| `src/main.ts`    | the process: env, the tool registry, the listener on port 3003 |
| `src/http/`      | the Streamable HTTP transport and the error envelope           |
| `src/server/`    | the MCP server itself; see its own README                      |
| `src/tests/`     | an end-to-end test driving the real SDK client                 |

## Stateless on purpose

Every request authenticates and builds its own server and transport. A long-lived session would keep
serving the tool set the token had when it was opened, which is exactly the guarantee zadání kap. 9
makes the other way round: a role taken away has to narrow the token immediately.

## Every call is in the audit log

A tool call and a resource read both write an `audit_log` row with `actor = user` (the token's owner)
and `via = api_token:<id>`, so the trail says both who acted and what they acted through. Protocol
chatter — `initialize`, `tools/list` — is not recorded: it changes nothing and would bury what does.

## Running it

`pnpm dev` runs it under `tsx`, and so does `pnpm start`. There is no bundle step, for the same
reason as in `apps/workers`: feature tools are discovered from source by directory convention at
startup, which a self-contained bundle cannot do.
