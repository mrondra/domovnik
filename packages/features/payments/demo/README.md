# payments/demo

| File           | Contents                                                               |
| -------------- | ---------------------------------------------------------------------- |
| `bank-sync.ts` | scenario kind `bank_sync`: reads the last twelve months of one account |
| `reset.ts`     | registers this feature's `demoReset` with `demo`                       |

**The rule:** `demo` never imports this directory. Both files are named in this feature's own
generated `registry.generated.ts` (`pnpm demo:registry`), which `index.ts` imports for its side
effects, and found by `demo`'s test fixture's own glob at test time.
