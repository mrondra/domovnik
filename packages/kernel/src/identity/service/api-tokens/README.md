# identity/service/api-tokens

The MCP/REST bearer token (zadání §9): a named subset of the tools its owner may use, optionally
narrowed to some SVJ and given an expiry.

| File        | Contents                                                                    |
| ----------- | --------------------------------------------------------------------------- |
| `types.ts`  | `CreateApiTokenInput`, `IssuedApiToken`, `ApiTokenGrant`, `ApiTokenSummary` |
| `issue.ts`  | `createApiToken` — issues the plaintext once and stores only its HMAC       |
| `verify.ts` | `verifyApiToken` — the cross-tenant lookup a bearer header resolves through |
| `manage.ts` | `listApiTokens`, `revokeApiToken`                                           |

**The rule:** a token never carries more than its owner. That holds in two places on purpose —
`issue.ts` refuses a tool the owner may not use at all, and `verify.ts` re-reads the owner's roles
on **every** call, so taking a role away narrows every token that user owns without touching a row.
The first check is for the person creating the token; the second is the one that is load-bearing.
