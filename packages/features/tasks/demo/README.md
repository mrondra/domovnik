# tasks/demo

| File       | Contents                                         |
| ---------- | ------------------------------------------------ |
| `reset.ts` | registers this feature's `demoReset` with `demo` |

**The rule:** `demo` never imports this directory. A scenario kind of this feature's own belongs
here too, in its own file — named in this feature's own generated `registry.generated.ts`
(`pnpm demo:registry`, run by `pnpm gen:feature` too), which `index.ts` imports for its side
effects. Nothing here is ever imported by name from `demo` itself.
