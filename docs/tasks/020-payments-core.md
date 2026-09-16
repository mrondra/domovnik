# 020 – payments: schema a deterministické párování

Reference: ADR 0004 (200 pohybů → 1 běh agenta), zadání kap. 7 (`payment-matcher`).

## Navazuje na

- 013 (`ReceivablesService.findByVariableSymbol`, `recordPayment`), 014 (`invoice` s `variable_symbol`, `amount_total`, stav `posted`/`approved`; `transition('paid')`).

## Vytvoří / upraví

- `pnpm gen:feature payments`
- `schema.ts`: `bank_account` (`svjTable`: `iban`, `number text`, `bank_code text`, `label`, `is_primary bool`), `bank_transaction` (`svjTable`: `bank_account_id`, `external_id text NOT NULL` unique `(tenant, bank_account_id, external_id)`, `booked_on date`, `amount numeric(12,2)` (kladné příjem), `counterparty_account text`, `counterparty_name text`, `variable_symbol text`, `specific_symbol text`, `message text`, `match_status match_status` (enum `unmatched, matched, proposed, ignored`)), `payment_match` (`svjTable`: `transaction_id`, `target_type match_target` (`prescription`, `invoice`), `target_id uuid`, `amount numeric(12,2)`, `method match_method` (`vs_amount`, `vs_only`, `agent`, `manual`), `confidence numeric(3,2)`, `approval_id uuid NULL`).
- `domain/…`, `service/index.ts`, `payments.service.ts`, `import.ts` (`importTransactions`), `matching/index.ts`, `matching/rules.ts`, `matching/apply.ts`, `api/payments.module.ts`, `index.ts`, testy.

## Rozhraní

```ts
importTransactions(ctx, { svjId, bankAccountId, transactions: IncomingTransaction[] }): Promise<ImportResult>
// 1) upsert podle external_id (nové vs. už známé); 2) emit finance.transactions.imported { svjId, bankAccountId, count, newCount }
// 3) matchNew(ctx, svjId) nad všemi novými → 4) pokud residuál > 0: emit finance.transactions.unmatched { svjId, transactionIds[] }  (JEDEN event)
```

`matching/rules.ts` (čistě funkční, testovatelné bez DB):

- Příjem (`amount > 0`): `findByVariableSymbol` → předpis nejstaršího neuhrazeného období téže jednotky; shoda částky ±1 Kč → `vs_amount`, confidence 1.0, `matched`; VS nalezen, částka jiná (např. násobek nebo částečná) → `unmatched` s `hint: 'vs_only'` (residuál); VS nenalezen → residuál.
- Výdaj (`amount < 0`): faktura ve stavu `approved|posted` se stejným `variable_symbol` a `|amount|` ±1 Kč → `matched` + `transition(invoice, 'paid')` (jen pokud je `posted`; `approved` bez `posted` → residuál s hintem `invoice_not_posted`) ; jinak residuál.
- `matched` příjem → `receivables.recordPayment(...)`; audit `payment.matched`.
  Eventy: `finance.transactions.imported`, `finance.transactions.unmatched` (agentní, dávkový), `finance.payment.matched { transactionId, targetType, targetId, method }`.

## Testy

- RLS na 3 tabulkách.
- Unit `rules.ts`: tabulka 10 případů (přesná shoda, ±0.5 Kč, 2× částka, cizí VS, výdaj na posted fakturu, výdaj na approved fakturu…).
- Integrace: import 200 transakcí, 195 s platným VS+částkou → 195 `matched`, `unit_balance_entry` +195, **právě jeden** `finance.transactions.unmatched` s 5 id; opakovaný import stejného souboru → 0 nových, žádný event.

## Akceptační kritéria

`pnpm verify` zelený; test „200/195/1 event" prochází (akceptace fáze 1 ze zadání).

## Mimo rozsah

Zdroj transakcí (021), agent (022), UI (023), likvidace v Pohodě (025).

## Stav po dokončení

Deterministické párování hotové; residuál emitován jako jeden event.
