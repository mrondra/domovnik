# payments/service

| File                  | Contents                                                       |
| --------------------- | -------------------------------------------------------------- |
| `payments.service.ts` | `PaymentsService`, the injectable face `apps/api` wires up     |
| `accounts.ts`         | the bank accounts of an SVJ                                    |
| `import.ts`           | a statement in, the rules run, and the residual announced once |
| `reach.ts`            | the access question every call naming an SVJ asks first        |
| `rows.ts`             | Drizzle row → domain type, and the `numeric` conversion back   |

**The rule:** importing the same statement twice adds nothing. The bank's own id for a movement is
unique per account, and `returning()` after `onConflictDoNothing` answers only what was really
written — so the matching pass runs over the new movements and nothing else.

The residual leaves as one event for the whole import. That is the difference between an agent run
per statement and an agent run per movement, and it is why the rules come first (ADR 0004).
