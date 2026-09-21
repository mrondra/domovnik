# seed

The contract a feature's demo data implements. The kernel holds the shape, the registry and the
order the modules run in; what runs them — over every feature at once, against a real database —
lives in `packages/db`.

| File          | Contents                                                       |
| ------------- | -------------------------------------------------------------- |
| `types.ts`    | `SeedModule` — what a feature declares — and `SeedContext`     |
| `registry.ts` | `defineSeed`, `registeredSeeds`, `clearSeeds`                  |
| `order.ts`    | `dependsOn` resolved into an order; a cycle is a build mistake |

`order.ts` lives here because `dependsOn` is this module's own field, and more than one caller has
to read it the same way: `pnpm db:seed` over a whole database, and a test that seeds one tenant.

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
