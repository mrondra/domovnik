# 047 – inspections: agent `inspection-report-reader` + scénář

## Navazuje na

- 046 (`ops.inspection.defects_unclassified`).

## Vytvoří / upraví

- `inspections/agents/inspection-report-reader/agent.ts`: trigger `ops.inspection.defects_unclassified`, `scope: 'svj'`, `model: 'sonnet'`, `autonomy: 'propose'`, `roles: ['manager']`, tools `inspection.get`, `document.get`, `svj.listUnits`, `defect.list`, `defect.create`, `task.create`. Prompt: pro každou položku rozhodni – je to závada (→ `defect.create` se závažností a zdůvodněním v `description`), nebo doporučení bez povinnosti (→ `task.create` pro `administration` s prioritou `low` „Doporučení z revize: …"). Nezakládej závadu, která už v `defect.list` pro tuto revizi je.
- `inspections/demo/inspection-report.ts` – kind `inspection_report`, payload `{ planCode: string, svjIco: string }`: najde otevřenou revizi plánu (pokud žádná, založí `planInspection` se smluvní firmou), vygeneruje zprávu generátorem z 046 a zavolá `attachReport`. Scénáře „Revizní zpráva elektro se závadami" (SVJ A) a „Revizní zpráva hromosvodu bez závad".
- Replay test: položka „svítidla ve sklepě" → `task.create` `low`; varianta „chybí ochrana před dotykem v bytě 205" (neexistující jednotka) → `defect.create` s `unitId` null a lokací v popisu.

## Akceptační kritéria

`pnpm verify`; scénář z UI → do 60 s závady a úkoly v UI.

## Stav po dokončení

Revize end-to-end včetně residuálu.
