# documents/demo

| File       | Contents                                         |
| ---------- | ------------------------------------------------ |
| `reset.ts` | registers this feature's `demoReset` with `demo` |

**The rule:** `demo` never imports this directory. This feature adds no scenario kind of its own —
its documents only ever arrive as a side effect of `invoices`' `inbound_invoice` scenario.
