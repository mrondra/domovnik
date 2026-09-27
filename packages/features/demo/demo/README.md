# demo/demo

| File            | Contents                                                                |
| --------------- | ----------------------------------------------------------------------- |
| `daily-tick.ts` | scenario kind `daily_tick`: fires `tick.daily` for the tenant on demand |

**The rule:** `demo` is a feature like any other here — its own scenario kind lives in this
directory rather than being wired into `domain/definition.ts` by hand. Named in `demo`'s own
generated `registry.generated.ts` (`pnpm demo:registry`), the same way every other feature's
`demo/*.ts` is, and found by `demo`'s own test fixture's glob at test time.
