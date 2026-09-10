# seed

The seed runner. It fills a fresh database with a demo tenant one can log into and click through;
the data is invented, never a copy of anything real (AGENTS.md §7).

| File                  | Contents                                                                   |
| --------------------- | -------------------------------------------------------------------------- |
| `types.ts`            | `SeedModule` — what a feature exports — and the `SeedContext` it receives  |
| `kernel.ts`           | the kernel-owned rows: the demo tenant, and the context every feature gets |
| `demo-users.ts`       | one user per role from `ROLES`                                             |
| `agent-identities.ts` | an identity per registered agent, discovered by convention                 |
| `discovery.ts`        | loads `packages/features/*/seed/index.ts`                                  |
| `order.ts`            | topological order over `dependsOn`; a cycle is a `DomainError`             |
| `runner.ts`           | `runSeed()` — the kernel seed first, then the features                     |

A feature seed looks like this:

```ts
// packages/features/svj/seed/svj.seed.ts
export const seed: SeedModule = {
  name: 'svj',
  dependsOn: [],
  run: async ({ ctx }) => {
    /* upsert by a stable key */
  },
};
```

**The rule:** every seed is idempotent — it upserts by a stable business key, never by a generated
id. `pnpm db:seed` twice in a row must leave the database exactly as it was after the first run.
