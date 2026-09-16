# 023 – payments + receivables: API a web

## Navazuje na

- 022; 013 (API receivables), 018 (vzor UI + evidence renderer).

## Vytvoří / upraví

- `payments/api/payments.controller.ts`: `GET /svj/:svjId/transactions?status=&from=&to=`, `GET /transactions/:id` (+ match, approval, kandidáti), `POST /transactions/:id/match` (ruční, `finance.write`, method `manual`), `POST /transactions/:id/ignore`.
- `payments/ui/`: `TransactionListScreen.tsx` (filtr stavu, badge), `TransactionDetailScreen.tsx` (kandidáti, návrh agenta, ruční párování), evidence renderer pro `payment.proposeMatch`, navigace „Platby".
- `receivables/ui/`: `PrescriptionsScreen.tsx` (měsíc, jednotky, předpis vs. uhrazeno), `DebtorsScreen.tsx` (dlužníci, saldo, nejstarší neuhrazené období), navigace „Předpisy a saldo"; `ui/index.ts` exportuje zod schémata z 013.
- `apps/web/src/api/payments.ts`, `receivables.ts`, stránky `s/[svjId]/payments`, `s/[svjId]/payments/[id]`, `s/[svjId]/receivables`, `s/[svjId]/receivables/debtors`.
- Playwright: finance → platby → nespárovaná → ruční spárování → saldo jednotky se změní.

## Akceptační kritéria

- Committee vidí saldo a platby svého SVJ, nemůže párovat (tlačítka skrytá i API 403).
- `pnpm build` web; e2e zelené.

## Stav po dokončení

Finanční část dema je vidět.
