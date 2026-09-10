# tools/registry

The registry itself. Registration is a side effect of definition, so a tool file never has to be
imported by hand — loading it by convention (`loadToolsFrom`) is enough.

| File                 | Contents                                                                |
| -------------------- | ----------------------------------------------------------------------- |
| `registered-tool.ts` | `RegisteredTool` and `erase()` — the type-erased form of a definition   |
| `store.ts`           | the registry map: `defineTool`, `requireTool`, `getTools`, `clearTools` |

`erase()` exists because the registry has to accept `unknown` (input arrives over HTTP or from a
model) while a tool definition should stay fully typed. The way out is to move validation inside the
entry: a `RegisteredTool` validates its own input and output, so no caller has to cast anything.

`getTools({ names, actor })` filters by name and by the actor's permissions — that is how the tool
set for an agent, or for an MCP token, comes about.
