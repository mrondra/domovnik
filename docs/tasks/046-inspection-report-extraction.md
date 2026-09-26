# 046 – inspections: revizní zpráva – extrakce a závady kódem

Reference: ADR 0004; vzor extrakce `invoices/service/extraction/*`.

## Navazuje na

- 039 (detail revize), 035 (`createDefect`), 042 (`pdfText` v `shared`).

## Vytvoří / upraví

- `document_category` už obsahuje `inspection_report` (011) – ověř.
- API `POST /inspections/:id/report` (multipart PDF, `ops.write`) → `service/report.ts` `attachReport(ctx, inspectionId, pdf)` → `storeDocument(category 'inspection_report', linkedEntity inspection)` → emit `ops.inspection.report_uploaded` `{ inspectionId, svjId, documentId }`. Revize ve stavu `planned|scheduled`, jinak `DomainError`.
- `subscribers/read-report.ts` (`inspections.read-report`) → `service/report-processing.ts`:
  1. `pdfText` → `llm.extract(haiku)` se schématem `reportExtractionSchema`: `performedOn`, `result: 'ok' | 'defects' | 'failed'`, `nextDueOn?`, `technician?`, `defects[]: { description, location?: string, severity?: 'critical'|'major'|'minor', legalRef?: string }`. Prompt česky; revizní zprávy často třídí závady písmeny nebo slovy („bezpečnost ohrožující" = critical) – mapování je v promptu, ne v kódu.
  2. `completeInspection(performedOn, result, reportDocumentId, extraction)`; pokud `nextDueOn` ze zprávy je dřív než vypočtený → plán `next_due_on = nextDueOn`.
  3. Pro každou závadu: **kód** určí `buildingId` (budova plánu) a `unitId` (regex čísla jednotky v `location` proti `svj.listUnits`; žádná shoda → null) a `category` = obor typu revize. Závada **s** `severity` → `createDefect(source 'inspection', sourceRef inspection, dedupe 'inspection:<id>:defect:<index>')`. Závada **bez** `severity` nebo s `location`, která zmiňuje číslo jednotky, jež neexistuje → residuál.
  4. Residuál ≠ ∅ → **jeden** agentní event `ops.inspection.defects_unclassified` `{ svjId, inspectionId, items: [{ index, description, location? }] }`.
  5. `pdf_no_text` → úkol pro `administration` „Revizní zpráva bez textu – zpracovat ručně".
- Seed/generátor PDF revizní zprávy `inspections/seed/pdf/report.ts` (`pdf-lib`, česky): elektro SVJ A se 4 závadami – 1 critical (chybějící kryt rozvodnice ve 2. NP), 2 minor (popisky jističů, chybějící protokol o určení prostředí), 1 bez závažnosti („doporučujeme zvážit výměnu svítidel ve sklepě"); a hromosvod bez závad.
- Replay fixtury `tests/fixtures/llm/report-extract-*.json`.

## Testy

- Elektro zpráva → revize `done`, plán posunut o 60 měsíců, 3 závady + 3 úkoly (critical → urgent, maintenance, termín zítra), 1 položka v residuálu → 1 event.
- Hromosvod bez závad → `done`, `result ok`, žádný event.
- Druhé nahrání zprávy k `done` revizi → chyba.

## Akceptační kritéria

`pnpm verify`.

## Stav po dokončení

Akceptační kritérium fáze 2 č. 2 (zpráva → závady a úkoly) splněno kódem; residuál čeká na agenta.
