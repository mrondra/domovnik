# 019 – invoices: seed a demo tlačítko „doručit fakturu"

Reference: zadání kap. 10 (demo data), 15 (inbound endpoint).

## Navazuje na

- 018; seed `svj`, `receivables`.

## Vytvoří / upraví

- `seed/data/suppliers.ts` (8 dodavatelů: úklid, výtahy, elektřina, plyn, revize, pojišťovna, instalatér, střechař – anonymizované názvy, smyšlená IČO s platným kontrolním součtem), `seed/data/contracts.ts` (per SVJ: A 4, B 6, C 7 smluv vč. střechaře s `monthly_amount NULL` – zakázka), `seed/data/budget.ts` (aktuální rok, kategorie dle 014; SVJ C má `opravy` už z 90 % vyčerpané), `seed/invoices.seed.ts`.
- `seed/pdf/` – generátor PDF faktur (`pdf-lib`, česky, jednoduchá tabulka) + `seed/data/invoices.ts` se scénáři:
  1. SVJ A – úklid, běžná měsíční částka (→ approve bez rizik)
  2. SVJ C – střechař, 480 000 Kč nad rozpočet (→ `budget_exceeded`)
  3. SVJ B – výtahy, částka +35 % vs. smlouva (→ `amount_deviates`)
  4. SVJ A – neznámý dodavatel (→ `supplier_unknown`)
  5. SVJ B – duplicitní PDF scénáře 3 (→ odmítnuto)
     Seed **nefaktury nedoručuje** – jen vygeneruje PDF do `documents` s kategorií `other`? **Ne**: seed je uloží jako soubory do storage pod `tenants/<t>/demo/invoices/<n>.pdf` (nová `area 'demo'`) a zapíše jejich seznam do tabulky `demo_scenario` (`tenantTable`: `code`, `title`, `description`, `kind` = `inbound_invoice`, `payload jsonb` {storageKey, svjId, from, subject}) – tabulka patří do nové malé feature **`demo`** (`pnpm gen:feature demo`), aby se tlačítka pro předvádění nemíchala do byznys features.
- Feature `demo`: `schema.ts` (`demo_scenario`), `service/run.ts` (`runScenario(ctx, code)` – pro `inbound_invoice` stáhne PDF ze storage a zavolá `receiveInvoiceMail`), `api/demo.controller.ts` (`GET /demo/scenarios`, `POST /demo/scenarios/:code/run`; permission `tenant_admin`), `ui/DemoScreen.tsx` (seznam scénářů s tlačítkem „Spustit" a výsledkem), stránka `apps/web/src/app/(tenant)/demo/page.tsx`, navigace jen pro `tenant_admin`.
- Testy: seed idempotentní; `runScenario` 1 → faktura `pending_approval` (s replay fixturou z 017 – použij tytéž); scénář 5 → `duplicateOf`.

## Akceptační kritéria

- Po `pnpm db:seed` a spuštění workers: kliknutí „Spustit" u scénáře 1 v UI → do 30 s faktura v inboxu výboru SVJ A (e2e s replay).
- Všech 5 scénářů má popis, co má demo ukázat.

## Mimo rozsah

Reset dat (026), bankovní scénáře (021).

## Stav po dokončení

Demo faktur je spustitelné z UI.
