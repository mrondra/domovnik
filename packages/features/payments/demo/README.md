# payments/demo

| File           | Contents                                                               |
| -------------- | ---------------------------------------------------------------------- |
| `bank-sync.ts` | scenario kind `bank_sync`: reads the last twelve months of one account |
| `reset.ts`     | registers this feature's `demoReset` with `demo`                       |

**The rule:** `demo` never imports this directory. Both files are found by `demo`'s own glob
discovery (`loadDemoModules`) the moment they exist — nothing here is imported by name.
