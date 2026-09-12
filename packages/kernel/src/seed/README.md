# seed

The contract a feature's demo data implements. The kernel holds the shape and the registry only;
the runner that orders the modules and executes them lives in `packages/db`, which is the layer
allowed to see every feature at once.

| File          | Contents                                                   |
| ------------- | ---------------------------------------------------------- |
| `types.ts`    | `SeedModule` — what a feature declares — and `SeedContext` |
| `registry.ts` | `defineSeed`, `registeredSeeds`, `clearSeeds`              |

A feature declares its seed next to its data, and declaring it is what registers it:

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

**The rule:** the file is `*.seed.ts`, never the `index.ts` — a barrel may not call `defineSeed`,
and the loader globs for the file that does. Every seed is idempotent: it upserts by a stable
business key, never by a generated id, so `pnpm db:seed` can run twice.
