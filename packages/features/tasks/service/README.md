# tasks/service

The only place in this feature that writes. Subscribers (032) and `apps/api` come here through
`TasksService` or the plain functions it will delegate to.

| File                  | Contents                                                              |
| --------------------- | --------------------------------------------------------------------- |
| `tasks.service.ts`    | `TasksService`, the injectable seam for 032–034                       |
| `create.ts`           | `createTask` — idempotent on `dedupeKey`, no event on a repeat        |
| `assign.ts`           | `assignTask` — a person, or `null` to take it back                    |
| `status.ts`           | `changeStatus` and `applyStatus`, through the state machine           |
| `comment.ts`          | `commentTask`                                                         |
| `close-for-origin.ts` | `closeTasksForOrigin` — only the open tasks of one origin             |
| `queries.ts`          | `getTask` (with history) and `listTasks`; `overdue` derived on read   |
| `demo-reset.ts`       | what a demonstration threw away: every task and its history           |
| `activity.ts`         | the history line and the event every mutation leaves                  |
| `reach.ts`            | who sees which task; every call by id and every listing asks it first |
| `rows.ts`             | Drizzle row → domain type, and `overdue`                              |

**The rule:** a task has no SVJ unless it was raised for one. An actor whose reach is narrowed (a
`committee` member, a token with `svjScope`) sees only tasks with an `svj_id` in that list, never a
task without one; everyone else sees the whole tenant. A task out of reach answers `NotFoundError`,
the same as one that does not exist.
