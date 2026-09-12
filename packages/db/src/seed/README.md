# seed

The seed runner. It fills a fresh database with a demo tenant one can log into and click through;
the data is invented, never a copy of anything real (AGENTS.md §7).

The contract itself — `SeedModule`, `SeedContext` and `defineSeed` — lives in the kernel, because a
feature may not import from `packages/db`. This directory only collects and executes.

| File                  | Contents                                                                   |
| --------------------- | -------------------------------------------------------------------------- |
| `demo-tenant.ts`      | the kernel-owned rows: the tenant, and the context every feature seed gets |
| `demo-users.ts`       | one user per role from `ROLES`                                             |
| `agent-identities.ts` | an identity per registered agent, discovered by convention                 |
| `discovery.ts`        | loads `packages/features/*/seed/*.seed.ts`, then reads the kernel registry |
| `order.ts`            | topological order over `dependsOn`; a cycle is a `DomainError`             |
| `runner.ts`           | `runSeed()` — the demo tenant first, then the features                     |

A feature seed looks like this:

```ts
// packages/features/svj/seed/svj.seed.ts
export const svjSeed = defineSeed({
  name: 'svj',
  dependsOn: [],
  run: async ({ ctx }) => {
    /* upsert by a stable business key */
  },
});
```

**The rule:** every seed is idempotent — it upserts by a stable business key, never by a generated
id. `pnpm db:seed` twice in a row must leave the database exactly as it was after the first run.
