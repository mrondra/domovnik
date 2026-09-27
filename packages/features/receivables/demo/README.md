# receivables/demo

| File       | Contents                                         |
| ---------- | ------------------------------------------------ |
| `reset.ts` | registers this feature's `demoReset` with `demo` |

**The rule:** `demo` never imports this directory. This feature adds no scenario kind of its own —
its balances only ever change as a side effect of `payments`' `bank_sync` scenario.
