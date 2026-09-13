# generators

The skeletons nobody should be typing by hand. Every generator writes the whole batch or nothing,
refuses to overwrite, and runs its output through the repository's Prettier config, so
`pnpm verify` is green immediately after it ran.

| File / directory | Responsibility                                                               |
| ---------------- | ---------------------------------------------------------------------------- |
| `feature.ts`     | `pnpm gen:feature <name>` — a workspace package, registered with `apps/api`  |
| `tool.ts`        | `pnpm gen:tool <feature> <name> [--approval]` — a tool and its tests         |
| `agent.ts`       | `pnpm gen:agent <feature> <name>` — definition, prompt, replay fixture, test |
| `adr.ts`         | `pnpm adr:new "<title>"` — the next number, from `docs/adr/template.md`      |
| `lib/`           | argument parsing, name casing, Prettier, commit scopes, file writing         |
| `templates/`     | the generated content, one module per generated area                         |
| `tests/`         | every generator run against a temporary repository copy                      |

`gen:feature` also touches two files it did not create: the commit scope list in
`commitlint.config.js` (asking first) and `apps/api/src/features/modules.generated.ts`, which Nest
is built from. Both are places where a feature has to be _named_ to exist — leaving them to a
follow-up command means a feature that looks finished and is not.

**The rule:** a generator produces the structure the conventions already demand — it never invents a
new one. When a template has to change because a convention changed, the convention moves first
(`AGENTS.md`, `docs/engineering.md` or an ADR) and the template follows.
