# accounting-sync/api

| File                        | Contents                                                       |
| --------------------------- | -------------------------------------------------------------- |
| `accounting.controller.ts`  | the state of the connection, asking Pohoda, closing a conflict |
| `accounting-sync.module.ts` | the Nest module `apps/api` discovers by file name              |

**The rule:** reading is open to whoever may reach the SVJ; anything that talks to the accounting
or settles a disagreement needs `finance.write`. The check is here, not in a guard, because guards
live in `apps/api` and a feature may not import from an app (ADR 0002).
