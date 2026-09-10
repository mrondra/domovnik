# context

`RequestContext` — tenant, actor, correlation id and optionally the SVJ and the agent run. Every
public service method takes it as its first argument.

| File                 | Contents                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `request-context.ts` | the `Actor` and `RequestContext` types, `createContext`, `withCorrelation`, `withSvj`, `withAgentRun` |
| `ambient.ts`         | `runInContext` / `currentContext` over AsyncLocalStorage, and the logger bound to a context           |

`Actor` is a discriminated union: `user` and `agent` have an id, `system` has `null`. Agents are
actors just like people (zadání §2.1) — which is why they have an identity, roles and an audit trail.

**The rule:** a context is derived, never mutated. `withSvj(ctx, id)` returns a new context; the
original stays as it was.
