# 055 – Fáze 2 end-to-end: stuby per feature, demo scénář, akceptace

Reference: zadání kap. 11 (fáze 2), `docs/demo-scenar.md`, ADR z 027 bod 5 (e2e bez modelu).

## Navazuje na

- 027–053 (054 jen pokud byl udělán).

## Vytvoří / upraví

- **Refaktor stubu modelu:** `apps/web/e2e/agent-replay.ts` → `apps/web/e2e/model-stubs/index.ts` (HTTP server, dispatch) + `model-stubs/<feature>.ts` per agent (`invoices`, `payments`, `accounting-sync`, `inspections` ×2, `quotes`, `field-reports`). Dispatch podle sady názvů toolů v požadavku (`mcp__domovnik__<tool>` – každý agent má jedinečnou kombinaci); extrakce (`llm.extract`) podle JSON schématu v požadavku. Pokud dispatch podle toolů nejde jednoznačně, zastav se a navrhni. Stávající `model-stub-*.ts` rozpustit do nové struktury. Stub přepisu audia pro `field.e2e.ts`.
- `apps/web/e2e/phase2.e2e.ts` – jeden průchod v pořadí demo scénáře níže, offline.
- `docs/demo-scenar.md` – druhá část „Provoz (fáze 2) – deset minut", stejný formát (co říct / kód / AI): 0. reset; 1. ranní kontrola termínů (`daily_tick`) → revize elektro naplánovaná kódem (smluvní firma), úkoly k autům; 2. hromosvod bez smluvní firmy → agent navrhne poptávku → manager schválí → „Odeslaná pošta"; 3. dodavatelé odpověděli → agent doporučí → výbor schválí → revize má dodavatele; 4. revizní zpráva elektro → závady a úkoly kódem, doporučení agentem; 5. technik z mobilu: živá hlasovka (nebo scénář „Hlášení technika po obchůzce") → úkoly ve 4 odděleních; 6. pohled vedoucí údržby: board oddělení.
  Přihlašovací údaje doplnit o technika(y) a managera.
- `docs/tasks/README-faze-2.md` – sekce „Stav po 055": tabulka akceptační kritérium fáze 2 → test; „Co zůstalo otevřené pro fázi 3" (mj. příkaz k úhradě z README-faze-1, pokud ho nikdo neudělal; sjednocení příchozí pošty do `comms`; SMTP adapter); seznam ADR vzniklých ve fázi 2. **Žádná tabulka odchylek bez ADR** (AGENTS.md DoD po 027).

## Akceptační kritéria

- `phase2.e2e.ts` a `phase1.e2e.ts` zelené lokálně i v CI bez sítě.
- Demo scénář ověřený klikáním proti `pnpm dev` s `LLM_MODE=live` (report: co se lišilo od stubu).

## Mimo rozsah

Fáze 3.
