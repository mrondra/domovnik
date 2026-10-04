# tasks

Tasks for the management company's departments (`task`, `task_activity`): optionally tied to an SVJ, routed by department, deduplicated by key.

| File / directory | Contents                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `schema.ts`      | tables, always through `tenantTable`/`svjTable`                                                                       |
| `domain/`        | types and event definitions, no I/O                                                                                   |
| `service/`       | the only place that mutates; emits events and writes audit rows                                                       |
| `subscribers/`   | reactions to events: a failed agent run (`agent.run.failed`) becomes an `administration` task, deduplicated by run id |
| `api/`           | the Nest module `apps/api` discovers                                                                                  |
| `tests/`         | unit tests plus the RLS isolation test for every table                                                                |
| `index.ts`       | the public face: what other features and apps may import                                                              |

**The rule:** everything outside this directory sees the feature through `index.ts` only. Reach
another feature through its `index.ts` or an event, never through its tables (docs/engineering.md §2).
