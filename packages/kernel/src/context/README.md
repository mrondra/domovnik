# context

`RequestContext` — tenant, actor, correlation id and optionally the SVJ, the SVJ scope of the
credential and the agent run. Every public service method takes it as its first argument.

| File                 | Contents                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `request-context.ts` | the `Actor` and `RequestContext` types, `createContext`, `withCorrelation`, `withSvj`, `withAgentRun`          |
| `ambient.ts`         | `runInContext` / `currentContext` / `requireContext` over AsyncLocalStorage, and the logger bound to a context |

`svjScope` is what the **credential** confines the actor to (ADR 0016), filled in by whoever verified
it. `undefined` is the whole tenant; `identity/reachableSvj(ctx)` is what intersects it with the
actor's own access, and anything listing across SVJ asks that rather than `accessibleSvj`.

`Actor` is a discriminated union: `user` and `agent` have an id, `system` has `null`. Agents are
actors just like people (zadání §2.1) — which is why they have an identity, roles and an audit trail.

**The rule:** a context is derived, never mutated. `withSvj(ctx, id)` returns a new context; the
original stays as it was.
