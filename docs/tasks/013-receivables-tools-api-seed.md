# 013 – receivables: tooly, API, seed předpisů

## Navazuje na

- 012 (`ReceivablesService`, `generatePrescriptions`).
- Seed `svj` (3 SVJ: A 12, B 80, C 40 jednotek) – pořadí seedů řeší `defineSeed({ after: ['svj'] })` (ověř v `packages/kernel/src/seed`).

## Vytvoří / upraví

- `tools/list-prescriptions.ts` (`receivables.listPrescriptions`), `tools/unit-balance.ts` (`receivables.unitBalance`), `tools/list-debtors.ts` (`receivables.listDebtors`) – všechny `readOnly`, `userComposable`, permission `finance.read`.
- `api/receivables.controller.ts`: `GET /svj/:svjId/prescriptions?year=&month=`, `GET /svj/:svjId/units/:unitId/balance`, `GET /svj/:svjId/debtors?minDebt=`; `api/receivables.schema.ts`.
- `seed/receivables.seed.ts` + `seed/plan.ts`: 12 měsíců předpisů (aktuální měsíc −11 … aktuální) pro všechna 3 SVJ; sazby: fond oprav 35 Kč/m², zálohy služby 1 800 Kč/byt, 600 Kč/garáž, 2 400 Kč/nebyt, správa 250 Kč/jednotka. Platby zatím **ne** (přijdou s bankovním generátorem v 021, aby saldo vznikalo z pohybů).
- `tests/tools.int.test.ts`, `tests/api.int.test.ts`, `tests/seed.int.test.ts`.

## Rozhraní

Zod odpovědi v `api/receivables.schema.ts` (`prescriptionSchema`, `unitBalanceSchema`); tytéž budou exportované z `ui/index.ts` v 023.

## Testy

- Seed idempotentní (2× běh = stejný počet řádků); SVJ B má 80 × 12 předpisů.
- API: committee SVJ A nevidí předpisy B (403/404 dle vzoru `svj`); token se `svjScope=[A]` totéž.
- Tool `receivables.listDebtors` po seedu vrátí všechny jednotky (žádné platby) – to je očekávané.

## Akceptační kritéria

`pnpm db:seed` opakovaně; `pnpm verify` zelený; OpenAPI obsahuje 3 endpointy.

## Mimo rozsah

UI (023).

## Stav po dokončení

Předpisy v DB pro 12 měsíců; `findByVariableSymbol` má na co párovat.
