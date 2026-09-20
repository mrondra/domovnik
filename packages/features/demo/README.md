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

This feature exists so the buttons do not live in the business features. `invoices` knows how to
receive an invoice; it has no business knowing that somebody wants to show that off. What each
feature contributes is the file and the description, written during its own seed.

Scenarios are tenant-scoped and only a `tenant_admin` may run one: running a scenario creates real
invoices in real SVJ, and the committee of those SVJ will see them.
