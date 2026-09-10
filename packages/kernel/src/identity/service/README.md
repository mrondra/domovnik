# identity/service

The reads and writes behind the `identity` module.

| File                | Contents                                                        |
| ------------------- | --------------------------------------------------------------- |
| `tenants.ts`        | `createTenant` — a tenant's first row, hence `withSystem`       |
| `users.ts`          | `createUser`, `rolesOf`, `requireUser`                          |
| `authentication.ts` | `authenticate` — password check and resolution to a tenant      |
| `sessions.ts`       | `createSession`, `verifySession`, `revokeSession`               |
| `api-tokens.ts`     | `createApiToken`, `verifyApiToken`, `revokeApiToken`            |
| `agent-identity.ts` | `ensureAgentIdentity` — one identity per agent name and version |
| `system-context.ts` | the context used for the cross-tenant lookup                    |

**The rule:** signing in and verifying a token are necessarily **cross-tenant** — the tenant is
exactly what those operations resolve. They therefore go through `withSystem` and return a
`tenantId` from which the caller builds the `RequestContext`. Everything else runs under
`withTenant`.
