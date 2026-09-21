# accounting-sync/service

| File                         | Contents                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| `accounting-sync.service.ts` | `AccountingSyncService`, the injectable face `apps/api` wires up |
| `links.ts`                   | which accounting unit an SVJ is, and served by what              |

**The rule:** an SVJ without a link is not guessed at. `requireLink` refuses, because posting an
invoice into the wrong accounting unit is a mistake that is discovered by an accountant weeks later.
