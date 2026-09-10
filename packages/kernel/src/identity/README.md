# identity

Who is acting: tenants, users, roles and permissions, sessions, API tokens, signed one-time links
and agent identities. Auth is our own (ADR 0007) — no sign-up and no password reset; the users come
from the seed.

| File / directory | Contents                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `roles.ts`       | the roles (`tenant_admin`, `manager`, `finance`, `technician`, `committee`, `owner`, `agent_author`) |
| `permissions.ts` | the role → permission map with wildcards, `hasPermission(actor, permission)`                         |
| `secrets.ts`     | argon2 for passwords, HMAC for tokens, opaque token generation                                       |
| `signed-link.ts` | the signed link used to approve from an e-mail                                                       |
| `service/`       | the reads and the writes                                                                             |

`hasPermission` always lets the `system` actor through; `tenant_admin` holds `*`. A permission reads
`domain.action` and a wildcard stays inside its domain — `finance.*` does not grant `ops.read`.

**The rule:** passwords go through argon2, bearer tokens are stored as an HMAC digest only — the
plaintext is returned once, at creation, and kept nowhere. A signed link is stateless; single use is
enforced by the target's own state transition (an `Approval` leaves `pending` exactly once), not by
the token.
