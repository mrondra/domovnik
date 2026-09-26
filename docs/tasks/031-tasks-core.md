# 031 – tasks: členství v odděleních, schéma, service

Reference: zadání kap. 4 (Provoz – task), ADR 0011, 0016.

## Navazuje na

- `department` v `svj` (`listDepartments`, kódy `maintenance`, `finance`, `cleaning`, `technicians`, `administration`).
- Uživatelé mají role, ale **nejsou členy oddělení** – to přidává tento úkol.

## Vytvoří / upraví

V `svj` (vlastní `department`):

- tabulka `department_member` (`tenantTable`: `department_id uuid NOT NULL`, `user_id uuid NOT NULL`, unique `(tenant, department_id, user_id)`), service `addDepartmentMember`, `departmentsOf(ctx, userId)`, `membersOf(ctx, departmentId)`, `departmentByCode(ctx, code)`; export z `svj/index.ts`.
- seed: finance → `finance`; technician → `technicians` + `maintenance`; manager → `administration`; tenant_admin → `administration`.

Nová feature `pnpm gen:feature tasks`:

- `schema.ts`: `task` (`tenantTable` – úkol nemusí patřit SVJ, např. STK auta):
  `svj_id uuid NULL`, `title text NOT NULL`, `description text NOT NULL DEFAULT ''`, `status task_status` (`open`, `in_progress`, `waiting`, `done`, `cancelled`), `priority task_priority` (`low`, `normal`, `high`, `urgent`), `department_id uuid NOT NULL`, `assignee_id uuid NULL`, `due_on date NULL`, `origin_type text NULL`, `origin_id uuid NULL`, `dedupe_key text NULL`, `created_by_agent_run_id uuid NULL`, `closed_at timestamptz NULL`. Unique partial `(tenant, dedupe_key) WHERE dedupe_key IS NOT NULL`. Indexy `(tenant, department_id, status)`, `(tenant, assignee_id, status)`, `(tenant, svj_id, status)`, `(tenant, origin_type, origin_id)`.
  `task_activity` (`tenantTable`): `task_id`, `kind` (`comment`, `status_changed`, `assigned`, `created`), `body text NULL`, `data jsonb NULL`, `actor_type`, `actor_id`.
- `domain/status.ts` – automat: `open → in_progress|waiting|done|cancelled`, `in_progress → waiting|done|cancelled|open`, `waiting → in_progress|done|cancelled`, `done → open` (znovuotevření), `cancelled → open`.
- Service (`service/`), každá mutace `withTenant` + `audit.record` + `task_activity` + event:
  ```ts
  createTask(ctx, { svjId?, title, description?, priority, departmentCode | departmentId, assigneeId?, dueOn?, origin?: { type, id }, dedupeKey? }): Promise<{ task: Task; created: boolean }>
    // dedupeKey existuje → vrátí existující, created=false, žádný event (idempotence subscriberů)
  assignTask(ctx, taskId, assigneeId | null)
  changeStatus(ctx, taskId, to, note?)          // closed_at při done/cancelled
  commentTask(ctx, taskId, body)
  closeTasksForOrigin(ctx, { type, id }, { status: 'done' | 'cancelled', note })   // pro subscribery (032)
  getTask(ctx, id) → Task + activity
  listTasks(ctx, { departmentId?, assigneeId?, svjId?, status?: TaskStatus[], overdueOnly?, originType? })
  ```
  Viditelnost: aktér se `svjScope` vidí jen úkoly s `svj_id` v rozsahu (úkoly bez SVJ nevidí); `committee` jen úkoly svých SVJ; ostatní role vše v tenantu. `overdue` = `due_on < today AND status IN (open, in_progress, waiting)` – počítá se při čtení, nic se neukládá.
  Eventy (`domain/events.ts`): `ops.task.created` `{ taskId, svjId, departmentId, priority, originType, originId }`, `ops.task.assigned`, `ops.task.status_changed` `{ taskId, from, to }`.
- Oprávnění: `finance` + `tasks.read`, `tasks.update`; `committee` + `tasks.read`; ostatní beze změny (`manager` má `tasks.*`, `technician` `tasks.read`, `tasks.update`). `tasks.update` = status, komentář, převzetí sebe; `tasks.write` (přes `tasks.*`) = založení, přiřazení komukoli.
- `tasks/demo/reset.ts` – smaže úkoly s `origin_type` NOT NULL nebo vzniklé po seedu (seed úkoly nemá).

## Testy

- RLS `task`, `task_activity`, `department_member`.
- Automat tabulkově; `createTask` s `dedupeKey` 2× → 1 řádek, 1 event.
- Viditelnost: technik vidí úkol bez SVJ, committee SVJ A nevidí úkol SVJ B ani úkol bez SVJ, token se `svjScope` nevidí úkol bez SVJ.
- `closeTasksForOrigin` zavře jen otevřené úkoly daného původu.
- Audit + activity u každé mutace.

## Akceptační kritéria

`pnpm verify`, seed idempotentní.

## Mimo rozsah

Tooly, API, UI, subscribery (032–034).

## Stav po dokončení

`createTask`, `closeTasksForOrigin`, `listTasks` k dispozici; lidé jsou v odděleních.
