# demo

Things the platform can be made to do on purpose, so a demonstration shows the real thing rather
than a screen full of rows somebody wrote into a table (zadání kap. 10).

| File / directory | Contents                                                                    |
| ---------------- | --------------------------------------------------------------------------- |
| `schema.ts`      | `demo_scenario` — what a scenario is, keyed by its code                     |
| `domain/`        | the kinds of scenario there are, and the shape of each one's payload        |
| `service/`       | writing scenarios down, reading them back, and running one                  |
| `api/`           | `GET /demo/scenarios` and `POST /demo/scenarios/:code/run`, both for admins |
| `ui/`            | the screen with a button per scenario                                       |
| `tests/`         | that every scenario ends where its own description says it will             |
| `index.ts`       | the public face: what other features and apps may import                    |

**The rule:** a scenario does the real thing. The invoice it delivers is a real PDF read out of
object storage and handed to `receiveInvoiceMail`, so nothing downstream knows it was a
demonstration — which is the only reason the demonstration proves anything.

**Today comes from here only.** `demoToday()` (`domain/today.ts`) is the single place the demo
chain — seed, bank statement range, demo invoices — reads the clock. Everything else takes the
date as a parameter, so a test passes an explicit day (or mocks that one module) instead of
depending on the day it happens to run.

Why: when the demo read the clock in several places, the seed took the running month while the
statement ended today, so from the 1st to the 14th (rent falls due on the 15th) the running
month's charge was unpaid and every unit was a debtor. That is why tests give the boundary days
their own case instead of pinning one convenient date.

This feature exists so the buttons do not live in the business features. `invoices` knows how to
receive an invoice; it has no business knowing that somebody wants to show that off. What each
feature contributes is the file and the description, written during its own seed.

Scenarios are tenant-scoped and only a `tenant_admin` may run one: running a scenario creates real
invoices in real SVJ, and the committee of those SVJ will see them.
