# 038 – inspections: hlídání termínů (kód) + scénář

Reference: ADR 0004 (kód první, dávkový agentní event), 028 (`daily_tick`).

## Navazuje na

- 037, 030 (`contractedSupplierFor`), 031 (`createTask`), 028 (scénáře konvencí).

## Cíl

Denní tik projde plány a vše, co jde, vyřeší kódem. Agentovi pošle **jednu dávku** plánů, na které SVJ nemá smluvní firmu.

## Vytvoří / upraví

- `inspections/subscribers/daily-due.ts` (`inspections.daily-due`, `tick.daily`) → `service/due-sweep.ts` `sweepDueInspections(ctx, today)`:
  Pro každý aktivní plán s `dueWindow ∈ {due_soon, overdue}` a **bez** otevřené revize (`openInspectionFor`):
  1. `contractedSupplierFor(svjId, type.specialization, today)` nalezen → `planInspection({ planId, supplierId, dedupeKey: 'plan:<id>:<next_due_on>' })` + `createTask({ title: 'Domluvit termín: <typ> – <budova>', departmentCode: 'administration', priority: overdue ? 'urgent' : 'high', dueOn: min(next_due_on − 7, today + 3), origin: { type: 'inspection', id }, dedupeKey: 'inspection:<id>:schedule' })`.
  2. Nenalezen → zařadí do residuálu per SVJ.
     Pro residuál: **jeden event per SVJ** `ops.inspection.due_soon` `{ svjId, planIds[], asOf }` (agentní; dedupe: event neemituj znovu pro plán, který už má `quote_request_id` na otevřené revizi – viz 043, nebo pro který byl event emitován týž den; ulož `inspection_plan.last_notified_on date NULL` – migrace).
     Po termínu (`overdue`) navíc úkol `urgent` pro `administration` „Revize po termínu" (dedupe `plan:<id>:overdue:<next_due_on>`), ať agent poptává, nebo ne.
- `inspections/demo/inspection-due.ts` – kind `inspection_due`, payload `{ planId, daysUntilDue }`: nastaví `next_due_on = today + daysUntilDue`, vynuluje `last_notified_on` a zavolá `sweepDueInspections` pro tenant. Seed zaregistruje scénáře „Blíží se revize hromosvodu (bez smluvní firmy)" (SVJ A hromosvod, 25) a „Blíží se revize elektro (smluvní firma)" (SVJ A elektro, 20).
- `taskOriginLinks` (`inspection` → detail revize) – stránka vznikne v 039; do té doby `path: null`.

## Testy

- Sweep nad seedem: SVJ A elektro → revize `planned` + úkol; SVJ A hromosvod a SVJ C hasicí přístroje → dva eventy `ops.inspection.due_soon` (per SVJ); SVJ B výtah (smluvní) po termínu → revize + úkol `urgent` + úkol „po termínu".
- Druhý sweep téhož dne → žádná nová revize, úkol ani event.
- Žádné volání LLM (test, že replay server nedostal požadavek).

## Akceptační kritéria

`pnpm verify`; scénáře v UI Demo spustitelné.

## Stav po dokončení

Termíny revizí hlídá kód; residuál čeká na agenta (043).
