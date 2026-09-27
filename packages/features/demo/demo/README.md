# demo/demo

| File            | Contents                                                                |
| --------------- | ----------------------------------------------------------------------- |
| `daily-tick.ts` | scenario kind `daily_tick`: fires `tick.daily` for the tenant on demand |

**The rule:** `demo` is a feature like any other here — its own scenario kind lives in this
directory rather than being wired into `domain/definition.ts` by hand, found by the same glob
discovery every other feature's `demo/*.ts` is.
