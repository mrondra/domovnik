# 050 – field-reports: agent `field-dispatcher` + scénář

## Navazuje na

- 049 (`field.report.needs_dispatch`).

## Vytvoří / upraví

- `field-reports/agents/field-dispatcher/agent.ts`: trigger `field.report.needs_dispatch`, `scope: 'svj'`, `model: 'sonnet'`, `autonomy: 'propose'`, `roles: ['manager']`, tools `fieldReport.get`, `svj.get`, `svj.listUnits`, `svj.listDepartments`, `task.list` (otevřené úkoly SVJ – kvůli duplicitám), `task.create`, `defect.create`, `fieldReport.markDispatched`.
- `prompt.md`: rozlož hlášení na samostatné práce, každou jako úkol do správného oddělení; co popisuje **stav domu** (rozbité, poškozené, nebezpečné) navíc jako závadu (`defect.create` – ten sám založí úkol, takže pro tutéž věc nevolej `task.create`); pokud stejný úkol už v `task.list` je, nezakládej ho a uveď to ve výsledku; jednotku přiřaď jen při jednoznačné shodě čísla; na konci vždy `fieldReport.markDispatched` se všemi založenými úkoly.
- `field-reports/demo/field-report.ts` – kind `field_report`, payload `{ svjIco, text, kind: 'text' }` (textová varianta přepisu – živou hlasovku ukazuje technik v PWA). Seed zaregistruje scénář „Hlášení technika po obchůzce" (SVJ B), text např.: _„Byl jsem na Kotlářské, ve třetím patře u výtahu nesvítí dvě světla, ve sklepě u kočárkárny teče ze stropu voda, vypadá to na odpadní potrubí. Pak paní z bytu 12 říkala, že jí nepřišlo vyúčtování. A na schodech je rozlitá barva, chtělo by to uklidit."_
- Replay test pro tento text: 4 výsledky – elektro/údržba (úkol), voda ze stropu (závada `major`, obor `instalater` → úkol v Údržbě), vyúčtování (úkol Finance, jednotka 12), úklid (úkol Úklid); `markDispatched` se 4 task id.

## Akceptační kritéria

Akceptační kritérium fáze 2 č. 3 (hlášení → úkoly pro správná oddělení); `pnpm verify`.

## Stav po dokončení

Terénní hlášení end-to-end na serveru.
