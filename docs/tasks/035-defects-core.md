# 035 – defects: schéma, service, tooly, API

Reference: zadání kap. 4 (defect), 7.

## Navazuje na

- 031–033 (`createTask`), `svj` (`building`, `unit`), `documents` (fotky).

## Cíl

Závada je stav domu (co je rozbité), úkol je práce (kdo to spraví). Založení závady **kódem** založí úkol podle pravidel.

## Vytvoří / upraví

`pnpm gen:feature defects`:

- `defect` (`svjTable`): `building_id uuid NULL`, `unit_id uuid NULL`, `title text NOT NULL`, `description text NOT NULL DEFAULT ''`, `location_note text NULL`, `severity defect_severity` (`critical`, `major`, `minor`), `category text NOT NULL` (obor ze `suppliers/domain/specializations` – importovat konstantu z `suppliers/index`), `source defect_source` (`inspection`, `field_report`, `owner`, `manual`), `source_type text NULL`, `source_id uuid NULL`, `status defect_status` (`open`, `in_repair`, `resolved`, `accepted_risk`), `photo_document_ids uuid[] NOT NULL DEFAULT '{}'`, `task_id uuid NULL`, `created_by_agent_run_id uuid NULL`, `dedupe_key text NULL` (unique partial).
- `domain/routing.ts` – **pravidla v kódu**:
  ```ts
  PRIORITY_BY_SEVERITY = { critical: 'urgent', major: 'high', minor: 'normal' }
  DUE_DAYS_BY_SEVERITY = { critical: 1, major: 14, minor: 60 }
  DEPARTMENT_BY_CATEGORY: uklid → 'cleaning'; energie, pojisteni → 'administration'; vše ostatní → 'maintenance'
  ```
- Service:
  ```ts
  createDefect(ctx, { svjId, buildingId?, unitId?, title, description?, locationNote?, severity, category, source, sourceRef?: { type, id }, photoDocumentIds?, dedupeKey? })
    : Promise<{ defect: Defect; task: Task; created: boolean }>
    // v jedné transakci: insert defect → createTask(routing, origin { type: 'defect', id }, dedupeKey 'defect:<id>') → uloží task_id
  updateDefectStatus(ctx, id, to)     // resolved → closeTasksForOrigin(defect, done); accepted_risk → cancelled
  listDefects(ctx, { svjId, status?, severity?, buildingId? }), getDefect(ctx, id)
  ```
  Eventy: `ops.defect.created` `{ defectId, svjId, severity, category, source }`, `ops.defect.status_changed`.
  Subscriber `defects/subscribers/task-done.ts`: na `ops.task.status_changed` s `to = 'done'` a úkolem s `origin_type = 'defect'` → defekt `resolved` (pokud není). Payload eventu nemá origin → subscriber si ho přečte přes `getTask` z `tasks/index`.
- Tooly: `defect.list`, `defect.get` (readOnly, userComposable, `defects.read`), `defect.create` (`proposal: true`, bez approvalu, userComposable, `defects.write`; z agenta vyplní `created_by_agent_run_id`).
- Oprávnění: `technician` má `defects.*`; přidej `manager` `defects.*`, `committee` `defects.read`.
- API: `GET /svj/:svjId/defects?status=&severity=`, `GET /defects/:id`, `POST /svj/:svjId/defects` (manuální), `PATCH /defects/:id/status`.
- `demo/reset.ts`.

## Testy

- RLS; `createDefect` → úkol ve správném oddělení s prioritou a termínem (tabulkově pro 3 severity × 3 kategorie).
- Idempotence přes `dedupeKey`.
- Úkol `done` → defekt `resolved`; defekt `resolved` → úkol `done` (bez nekonečné smyčky – test, že druhý event nic neudělá).

## Akceptační kritéria

`pnpm verify`.

## Stav po dokončení

`createDefect` pro `inspections` (046) a `field-reports` (049).
