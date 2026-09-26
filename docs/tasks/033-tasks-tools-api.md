# 033 – tasks: tooly a API

## Navazuje na

- 031, 032.

## Rozhraní

Tooly (`packages/features/tasks/tools/`):

- `task.list` – `{ svjId?, departmentCode?, status?, overdueOnly? }`, readOnly, userComposable, `tasks.read`.
- `task.get` – `{ taskId }`, readOnly, userComposable, `tasks.read`.
- `task.create` – `{ svjId?, title, description, priority, departmentCode, dueOn?, origin? }`, `proposal: true`, `neverRequiresApproval`, userComposable, `tasks.write`. Pokud aktér je agent, doplní `created_by_agent_run_id` z kontextu a `dedupeKey` = `agent_run:<runId>:<hash(title)>` (agent při retry nezaloží duplicitu).
- `task.comment` – `{ taskId, body }`, `tasks.update`, userComposable.
  Agent s autonomií `propose` smí `task.create` (zadání kap. 6.3: úkoly jsou interní záznamy).

API (`tasks/api/`):

- `GET /tasks?departmentId=&assignee=me|<id>&svjId=&status=&overdue=true` (seznam; `limit` default 50, max 200, řazení `due_on NULLS LAST, priority, created_at`; kurzorové stránkování zatím ne – v repu žádný vzor není)
- `GET /tasks/:id` (úkol + activity + `origin` `{ type, id }`)
- `POST /tasks` (`tasks.write`), `PATCH /tasks/:id/status` `{ to, note? }` (`tasks.update`), `PATCH /tasks/:id/assignee` `{ assigneeId | null }` (`tasks.write`; `tasks.update` smí jen `assigneeId = já`), `POST /tasks/:id/comments`
- `GET /departments/:id/members` (v `svj/api/departments.controller.ts`)
- `api/tasks.schema.ts` – zod odpovědí (`taskView`, `taskDetailView`), tytéž exportuje `ui/index.ts` v 034.

## Testy

- API: technik převezme úkol (assignee = já) → 200; technik přiřadí jinému → 403; committee zakládá → 403.
- Tool `task.create` z agenta v replay testu (použij `runAgentInTest` s triviálním agentem v testu) → `created_by_agent_run_id` vyplněno; opakovaný běh se stejným titulkem → jeden úkol.

## Akceptační kritéria

`pnpm verify`; OpenAPI obsahuje endpointy pod tagem `tasks`.

## Stav po dokončení

Úkoly ovladatelné přes API, MCP a agenty.
