# 039 – inspections: API a web (kalendář, plán, detail)

## Navazuje na

- 38.

## Vytvoří / upraví

- API: `GET /inspections/calendar?from=&to=&svjId=` (cross-SVJ pro manager, `svjScope`), `GET /svj/:svjId/inspection-plans`, `GET /inspection-plans/:id` (plán + historie revizí), `GET /inspections/:id`, `PATCH /inspections/:id/schedule` `{ scheduledOn, supplierId }` (`ops.write`), `POST /inspections/:id/cancel`.
- `inspections/ui/`: `InspectionCalendarScreen.tsx` (měsíční přehled jako seznam po týdnech – ne grid knihovna; barva podle okna ok/due_soon/overdue; tenant i SVJ úroveň), `InspectionPlansScreen.tsx` (per SVJ tabulka: typ, budova, poslední, příští, smluvní firma ano/ne, stav otevřené revize), `InspectionDetailScreen.tsx` (plán, dodavatel, termín, výsledek, zpráva – odkaz, závady z této revize přes `defect.list` filtr `source_id`, úkoly), `ScheduleForm.client.tsx`, `labels.ts`, `wire.ts`, `navigation.ts` („Revize" – tenant i SVJ).
- `taskOriginLinks.inspection` doplnit `path`.
- `apps/web/src/api/inspections.ts` + stránky `(tenant)/inspections`, `s/[svjId]/inspections`, `s/[svjId]/inspections/plans/[id]`, `s/[svjId]/inspections/[id]`.
- E2E: scénář „elektro (smluvní firma)" → kalendář ukazuje revizi `planned` → úkol „Domluvit termín" → manager zadá termín → `scheduled`.

## Akceptační kritéria

`pnpm build`, e2e zelené; committee vidí kalendář svého SVJ read-only.
