# 026 – Fáze 1 end-to-end: demo scénář, reset, akceptace

Reference: zadání kap. 11 (Fáze 1 – akceptační kritéria), kap. 10.

## Navazuje na

- 009–025.

## Vytvoří / upraví

- Feature `demo`: `POST /demo/reset` (`tenant_admin`): smaže data features `invoices`, `payments`, `receivables` entries, `accounting-sync`, `documents` kategorie invoice, `approval`, `agent_run` pro tenant (přes `withSystem` s reason) a znovu spustí seed – přes registr `resetHandlers` exportovaný každou feature z `index.ts` (`demoReset(ctx)`), aby `demo` neznalo tabulky ostatních. Tlačítko v `DemoScreen`.
- `docs/demo-scenar.md` (česky): krok za krokem prezentace 10 minut – reset → doručit fakturu 1 → inbox výboru (mobil, e-mail odkaz) → schválit → Pohoda `posted` → načíst výpis → `paid`, saldo, dlužníci → residuál a návrhy agenta → doručit fakturu 2 (nad rozpočet) → mutace v Pohodě → konflikt. U každého kroku: co říct, co je AI a co kód.
- `apps/web/e2e/phase1.e2e.ts`: celý scénář v replay režimu (workers spuštěné v testu – ověř, jak to řeší `apps/web/e2e/fixture.ts`; pokud e2e workers nespouští, přidej).
- `docs/tasks/README-faze-1.md`: doplň stav a odchylky (odkazy na nová ADR).
- Kontrola akceptačních kritérií fáze 1 ze zadání – tabulka kritérium → test, který ho dokazuje.

## Akceptační kritéria

- `phase1.e2e.ts` zelený lokálně i v CI (bez sítě).
- `docs/demo-scenar.md` odpovídá tomu, co UI skutečně umí (ověř klikáním, ne z paměti).
- Report: seznam všech ADR vzniklých ve fázi 1 a otevřených bodů pro fázi 2.

## Mimo rozsah

Fáze 2 (revize, terén, vozový park).
