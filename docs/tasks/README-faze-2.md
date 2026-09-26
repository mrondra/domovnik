# Fáze 2 – provoz (úkoly 027–055)

Cíl fáze (zadání kap. 11, fáze 2): **revize 30 dní před termínem spustí poptávku ke schválení;
nahraná revizní zpráva vytvoří závady a úkoly; hlášení technika se rozpadne na úkoly pro správná
oddělení.** K tomu úkoly a oddělení, dodavatelé jako samostatná feature, odchozí pošta a vozový park.

Formát úkolů je stejný jako ve fázi 1 (Navazuje na → Vytvoří/upraví → Rozhraní → Testy →
Akceptační kritéria → Mimo rozsah → Stav po dokončení). Úkol má odpovídat 1–3 hodinám práce; delší
úkol je chyba zadání – zastav se a řekni to.

## Vzory, které platí navíc k README-faze-1.md

Všechny vzory z `README-faze-1.md` platí dál. Z fáze 1 přibyly:

- **Approvers podle role:** `usersWithRole(ctx, role)` z `packages/kernel/src/identity/index`; podle výboru SVJ vzor `committeeOf` v `packages/features/invoices/service/decisions.ts`.
- **Entita čekající na schválení:** `onApprovalRequested` v `defineTool` (vzor `packages/features/invoices/tools/approve.ts`).
- **Evidence v inboxu:** `approvalEvidenceRenderers` z `ui/index.ts` feature, skládá `pnpm web:navigation` (vzor `packages/features/invoices/ui/evidence*`). Každý nový tool s approvalem má renderer.
- **Reset dema:** po úkolu 028 feature vystavuje reset a scénáře konvencí `demo/*.ts` – ne ruční úpravou `packages/features/demo`.
- **Verzování událostí:** změna payloadu = nová verze eventu, subscriber starší verzi přeskočí (vzor `finance.payment.matched` v2; pravidlo zapíše ADR v 027).
- **Idempotentní vznik úkolu:** každý subscriber, který zakládá úkol, předává `dedupeKey` (031).
- **Kdo zakládá úkol za cizí entitu:** subscriber v **feature, která entitu vlastní** (invoices zakládá úkol k faktuře), volá `createTask` z `packages/features/tasks/index`. `tasks` o doménách ostatních nic neví.
- **E2E bez modelu:** stub v `apps/web/e2e/` – po úkolu 055 rozdělený per feature.

## Nové závislosti mezi features (povolené směry)

```
tasks → svj
defects → tasks, svj, documents
suppliers → (nic z features)
invoices → suppliers, tasks          accounting-sync → invoices, tasks
inspections → suppliers, defects, tasks, documents
quotes → suppliers, comms, documents
field-reports → tasks, defects, documents, svj
fleet → tasks
demo → (nic z features; features importují demo)
```

Opačný směr jen přes eventy. `quotes` o `inspections` neví: vztah nese `relatedType`/`relatedId` jako neprůhledné hodnoty a výsledek (`ops.quote.awarded`) si `inspections` odebírá.

## Pořadí

| #   | Úkol                                                                  | Navazuje na |
| --- | --------------------------------------------------------------------- | ----------- |
| 027 | ADR za odchylky fáze 1, aktualizace zadání                            | fáze 1      |
| 028 | demo: scénáře a reset konvencí (obrácení závislostí)                  | 027         |
| 029 | suppliers: přesun `supplier` a `contract` z invoices (čistý refaktor) | 027         |
| 030 | suppliers: obory, pokrytí smluv, tooly, API, seed revizních firem     | 029         |
| 031 | tasks: členství v odděleních, schéma, service                         | 007         |
| 032 | tasks: úkoly z fáze 1 (needs_review, konflikt, selhání agenta)        | 031         |
| 033 | tasks: tooly a API                                                    | 032         |
| 034 | tasks: web (moje úkoly, oddělení, detail, odkazy na původ)            | 033         |
| 035 | defects: schéma, service, tooly, API                                  | 033         |
| 036 | defects: web                                                          | 035         |
| 037 | inspections: katalog, plány, revize, service                          | 030, 035    |
| 038 | inspections: hlídání termínů (kód) + scénář                           | 037, 028    |
| 039 | inspections: API a web (kalendář, plán, detail)                       | 038         |
| 040 | comms: odchozí pošta (simulovaná)                                     | 027         |
| 041 | quotes: schéma a service poptávky                                     | 030, 040    |
| 042 | quotes: příjem nabídky, porovnání, scénář                             | 041         |
| 043 | inspections: agent `inspection-planner` + tool `quote.proposeRequest` | 038, 042    |
| 044 | quotes: agent `quote-evaluator`, přidělení zakázky                    | 043         |
| 045 | quotes: API a web                                                     | 044         |
| 046 | inspections: revizní zpráva – extrakce a závady kódem                 | 039, 044    |
| 047 | inspections: agent `inspection-report-reader` + scénář                | 046         |
| 048 | kernel: přepis audia (Gemini)                                         | 001         |
| 049 | field-reports: schéma, service, routování kódem                       | 048, 035    |
| 050 | field-reports: agent `field-dispatcher` + scénář                      | 049         |
| 051 | field-reports: API a PWA pro technika                                 | 050, 034    |
| 052 | fleet: schéma, service, hlídání termínů                               | 031         |
| 053 | fleet: API, web, seed                                                 | 052         |
| 054 | _(volitelné)_ fleet: agent `technician-day-planner`                   | 053         |
| 055 | fáze 2 end-to-end: stuby per feature, demo scénář, akceptace          | vše         |
