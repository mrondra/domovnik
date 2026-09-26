# 037 – inspections: katalog, plány, revize, service

Reference: zadání kap. 4 (inspection_type, inspection), 7.

## Navazuje na

- 030 (obory, `contractedSupplierFor`), 035 (`createDefect`), `svj` (`building`).

## Vytvoří / upraví

`pnpm gen:feature inspections`:

- `inspection_type` (`tenantTable` – katalog správcovské firmy): `code text` (unique per tenant), `name text`, `legal_basis text`, `interval_months int NOT NULL`, `specialization text NOT NULL` (obor dodavatele), `applies_to inspection_scope` (`building`, `svj`).
- `inspection_plan` (`svjTable`): `inspection_type_id`, `building_id uuid NULL` (NULL pro `svj` scope), `last_done_on date NULL`, `next_due_on date NOT NULL`, `is_active boolean DEFAULT true`, `note text NULL`. Unique `(tenant, svj_id, inspection_type_id, building_id)`.
- `inspection` (`svjTable`): `plan_id`, `status inspection_status` (`planned`, `scheduled`, `done`, `cancelled`), `supplier_id uuid NULL`, `scheduled_on date NULL`, `performed_on date NULL`, `result inspection_result NULL` (`ok`, `defects`, `failed`), `report_document_id uuid NULL`, `extraction jsonb NULL`, `quote_request_id uuid NULL`, `dedupe_key text NULL` (unique partial).
- `domain/due.ts` (čistě funkční): `nextDueOn(lastDoneOn, intervalMonths)`, `dueWindow(plan, today, days = 30): 'overdue' | 'due_soon' | 'ok'`.
- Service:
  ```ts
  listPlans(ctx, { svjId, window?: 'overdue' | 'due_soon' }), getPlan(ctx, id)
  openInspectionFor(ctx, planId): Promise<Inspection | null>   // planned|scheduled
  planInspection(ctx, { planId, supplierId?, quoteRequestId?, dedupeKey? })   // status planned
  scheduleInspection(ctx, id, { scheduledOn, supplierId })                   // status scheduled
  completeInspection(ctx, id, { performedOn, result, reportDocumentId?, extraction? })
    // done; plán: last_done_on = performedOn, next_due_on = nextDueOn(...)
  cancelInspection(ctx, id, reason)
  calendar(ctx, { svjIds?, from, to }) → plány s next_due_on v rozsahu + revize scheduled v rozsahu
  ```
  Eventy: `ops.inspection.planned`, `ops.inspection.scheduled`, `ops.inspection.completed` `{ inspectionId, svjId, planId, result }`.
- Tooly (readOnly, userComposable, `ops.read`): `inspection.listPlans` (`{ svjId, window?, planIds? }`), `inspection.get` (`{ inspectionId }` + plán + typ + dodavatel).
- Seed `inspections/seed/`: katalog (hodnoty **orientační pro demo**, v `legal_basis` uveď předpis a poznámku „ověřit pro konkrétní dům"):
  | code                                                                                                                                                                                                                                                                                                                                                     | název                                      | interval | obor             | scope    |
  | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------- | ---------------- | -------- |
  | `elektro_spolecne`                                                                                                                                                                                                                                                                                                                                       | Revize elektroinstalace společných prostor | 60       | revize_elektro   | building |
  | `hromosvod`                                                                                                                                                                                                                                                                                                                                              | Revize hromosvodu                          | 48       | revize_hromosvod | building |
  | `plyn_revize`                                                                                                                                                                                                                                                                                                                                            | Revize plynového zařízení                  | 36       | revize_plyn      | building |
  | `plyn_kontrola`                                                                                                                                                                                                                                                                                                                                          | Kontrola plynového zařízení                | 12       | revize_plyn      | building |
  | `vytah_zkouska`                                                                                                                                                                                                                                                                                                                                          | Odborná zkouška výtahu                     | 36       | vytahy           | building |
  | `hasici_pristroje`                                                                                                                                                                                                                                                                                                                                       | Kontrola hasicích přístrojů                | 12       | hasici_pristroje | building |
  | `kominy`                                                                                                                                                                                                                                                                                                                                                 | Kontrola spalinové cesty                   | 12       | kominy           | building |
  | Plány pro 3 SVJ tak, aby dnes: SVJ A `elektro_spolecne` za 20 dní (smluvní firma **má**), SVJ A `hromosvod` za 25 dní (smluvní firma **nemá** → poptávka), SVJ B `vytah_zkouska` po termínu o 5 dní, SVJ C `hasici_pristroje` za 10 dní bez smlouvy, ostatní v budoucnu. Data počítej relativně k datu seedu (`last_done_on` = dnes − interval + N dní). |
- Oprávnění: `ops.read` mají manager, technician, committee (beze změny); `ops.write` jen manager (přes `ops.*`). Technik revize nemění – mění úkoly; revizi uzavírá kód po nahrání zprávy (046) nebo manager.
- `demo/reset.ts`: smaže revize vzniklé ukázkou a přepočítá plány stejnou funkcí, kterou je vytváří seed (`seed/plans.ts` exportuje `seedPlanDates(today)`; reset i seed ji volají).

## Testy

- RLS 3 tabulek; `nextDueOn`/`dueWindow` tabulkově (přelom měsíce, 29. 2.).
- `completeInspection` posune plán; druhé dokončení téže revize → `DomainError`.
- Seed: po seedu `listPlans(window: 'due_soon')` pro SVJ A vrátí 2 plány.

## Akceptační kritéria

`pnpm verify`, seed idempotentní.

## Mimo rozsah

Hlídání termínů (038), UI (039), zprávy (046).

## Stav po dokončení

Plány revizí s termíny; `planInspection`/`completeInspection`.
