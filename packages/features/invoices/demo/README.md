# invoices/demo

| File                 | Contents                                                                        |
| -------------------- | ------------------------------------------------------------------------------- |
| `inbound-invoice.ts` | scenario kind `inbound_invoice`: delivers an invoice already sitting in storage |
| `reset.ts`           | registers this feature's `demoReset` with `demo`                                |

**The rule:** `demo` never imports this directory. Both files are found by `demo`'s own glob
discovery (`loadDemoModules`) the moment they exist — nothing here is imported by name.
