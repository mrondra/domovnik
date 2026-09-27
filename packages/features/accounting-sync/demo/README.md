# accounting-sync/demo

| File                 | Contents                                                             |
| -------------------- | -------------------------------------------------------------------- |
| `pohoda-mutation.ts` | scenario kind `pohoda_mutation`: edits an invoice in the Pohoda mock |
| `reset.ts`           | registers this feature's `demoReset` with `demo`                     |

**The rule:** `demo` never imports this directory. Both files are found by `demo`'s own glob
discovery (`loadDemoModules`) the moment they exist — nothing here is imported by name.
