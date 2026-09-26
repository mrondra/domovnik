# 036 – defects: web

## Navazuje na

- 035, 034 (registr `taskOriginLinks`).

## Vytvoří / upraví

- `defects/ui/`: `DefectListScreen.tsx` (per SVJ; filtr stavu a závažnosti; sloupce budova/jednotka, závažnost, obor, zdroj, úkol, stáří), `DefectDetailScreen.tsx` (popis, fotky přes presigned URL z `document.get`, zdroj s odkazem, úkol s odkazem, změna stavu), `SeverityBadge.tsx`, `DefectForm.client.tsx` (ruční založení), `labels.ts`, `wire.ts`, `navigation.ts` („Závady" pod SVJ).
- `taskOriginLinks` pro `defect`.
- `apps/web/src/api/defects.ts`, stránky `s/[svjId]/defects`, `s/[svjId]/defects/[id]`, `s/[svjId]/defects/new`.
- E2E: manager založí závadu → úkol v oddělení Údržba → technik ho dokončí → závada `resolved`.

## Akceptační kritéria

`pnpm build`, e2e zelené; committee vidí závady svého SVJ bez ovládacích prvků.
