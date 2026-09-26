# 054 – (volitelné) fleet: agent `technician-day-planner`

Úkol dělej jen na výslovný pokyn. Fáze 2 bez něj splní akceptační kritéria.

## Navazuje na

- 053, 034.

## Cíl

Ráno pro každého technika návrh pořadí výjezdů z jeho otevřených úkolů napříč SVJ a vozidlo, které má k dispozici.

## Vytvoří / upraví

- `fleet/schema.ts`: `day_plan` (`tenantTable`: `user_id`, `plan_date`, `vehicle_id NULL`, `stops jsonb` – `[{ taskId, svjId, order, reason }]`, `summary text`, `agent_run_id`), unique `(tenant, user_id, plan_date)`.
- Kód: `subscribers/daily-plans.ts` na `tick.daily` → pro techniky s ≥ 2 otevřenými úkoly s `svj_id` a termínem do 3 dní vytvoří agentní event `fleet.day_plan.requested` `{ userId, date, taskIds[] }` (jeden per technik). Technik s 0–1 úkolem plán nepotřebuje.
- Agent `fleet/agents/technician-day-planner/`: `scope: 'tenant'`, `autonomy: 'propose'`, tools `task.get`, `svj.get` (adresy), `fleet.listVehicles`, `fleet.saveDayPlan` (nový tool, `proposal: true`, bez approvalu). Prompt: pořadí podle priority, termínu a adresy (stejná ulice/čtvrť za sebou); nevymýšlí vzdálenosti.
- UI: `/t` nahoře karta „Dnešní plán" (pořadí, důvod, vozidlo).
- Replay test: 4 úkoly ve 3 SVJ → plán se 4 zastávkami, urgentní první.

## Mimo rozsah

Skutečné trasy a časy jízdy (mapové API).
