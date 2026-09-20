# demo/service

| File              | Contents                                                              |
| ----------------- | --------------------------------------------------------------------- |
| `demo.service.ts` | `DemoService`, the injectable face `apps/api` wires up; it delegates  |
| `registry.ts`     | writing scenarios down, and reading them back                         |
| `run.ts`          | running one — today, delivering an invoice that is already in storage |

**The rule:** a scenario does the real thing. The invoice is read out of object storage and handed
to `receiveInvoiceMail`, so nothing downstream knows it was a demonstration — which is exactly what
makes the demonstration worth anything. Running one is audited like any other action.

A scenario that cannot be run truthfully does not belong here. Writing rows straight into a table
to make a screen look full would show what the screens can render, not what the platform does.
