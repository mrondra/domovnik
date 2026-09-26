# 049 – field-reports: schéma, service, routování kódem

Reference: zadání kap. 7 (`field-dispatcher`), 8 (Terén), ADR 0004.

## Navazuje na

- 048 (`transcribe`), 031 (`createTask`), 035 (`createDefect`), 011 (`storeDocument` – audio a fotky).

## Vytvoří / upraví

- `document_category`: přidej `field_audio`, `field_photo` (aditivní migrace v `documents`).
- `pnpm gen:feature field-reports`:
  - `field_report` (`svjTable`): `building_id uuid NULL`, `unit_id uuid NULL`, `reporter_id uuid NOT NULL`, `kind field_report_kind` (`voice`, `text`), `category field_report_category NULL` (`maintenance`, `cleaning`, `finance`, `technical`, `other`), `urgent boolean DEFAULT false`, `audio_document_id uuid NULL`, `photo_document_ids uuid[] DEFAULT '{}'`, `text text NULL` (psaný text nebo přepis), `status field_report_status` (`received`, `transcribed`, `dispatched`, `needs_dispatch`, `failed`), `dispatched_task_ids uuid[] DEFAULT '{}'`, `error text NULL`.
  - Service:
    ```ts
    submitReport(ctx, { svjId, buildingId?, unitId?, kind, category?, urgent?, text?, audio?: { body, mimeType }, photos?: { body, mimeType, filename }[] })
      // uloží audio/fotky přes storeDocument → insert received → emit field.report.submitted { reportId, svjId }
    getReport, listReports(ctx, { svjId?, reporterId?, status? })
    markDispatched(ctx, id, taskIds[]), markNeedsDispatch(ctx, id)
    ```
  - `subscribers/process-submitted.ts` → `service/processing.ts`:
    1. `voice` → `transcribe` → `text`, status `transcribed` (chyba → `failed` + úkol pro `administration`).
    2. **Routování kódem:** `category` vyplněná **a** `category ≠ 'other'` **a** text ≤ 280 znaků → jeden `createTask({ title: první věta textu (max 80 znaků), description: text + kdo nahlásil, departmentCode: CATEGORY_TO_DEPARTMENT, priority: urgent ? 'urgent' : 'normal', svjId, origin: { type: 'field_report', id }, dedupeKey: 'field_report:<id>' })` → `dispatched`.
       `CATEGORY_TO_DEPARTMENT = { maintenance: 'maintenance', cleaning: 'cleaning', finance: 'finance', technical: 'technicians' }`.
    3. Jinak → `needs_dispatch` + agentní event `field.report.needs_dispatch` `{ reportId, svjId }` (jedno hlášení = jedna dávka; hlášení nechodí hromadně).
  - Tooly: `fieldReport.get` (readOnly, `field.read`, text + fotky jako presigned URL + reporter + budova/jednotka), `fieldReport.markDispatched` (`{ reportId, taskIds[] }`, `proposal: true`, `field.write`).
  - Oprávnění: technician má `field.*`; manager přidej `field.*`.
  - `svj`: tool `svj.listDepartments` (readOnly) – agent potřebuje znát oddělení.
  - `demo/reset.ts`.

## Testy

- RLS; hlasové hlášení s `category=cleaning`, krátké → přepis (replay) → 1 úkol v Úklidu, `dispatched`.
- Dlouhé nebo bez kategorie → `needs_dispatch` + event; `other` → vždy agent.
- Selhání přepisu → `failed` + úkol.
- Idempotence subscriberu.

## Akceptační kritéria

`pnpm verify`.

## Stav po dokončení

Hlášení se ukládá a jednoduché případy routuje kód.
