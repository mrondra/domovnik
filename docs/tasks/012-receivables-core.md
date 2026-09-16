# 012 – receivables: schema, `ReceivablesAdapter`, `InternalReceivablesAdapter`

Reference: zadání kap. 4 (Finance – předpisy, saldo), kap. 8 (`ReceivablesAdapter`), ADR 0005.

## Navazuje na

- `svj` feature: `Unit` (`packages/features/svj/index.ts` → `SvjService.listUnits`, `getShareOfUnit`), event `svj.unit.updated`.
- Vlastníci (feature `owners`) ještě neexistují: předpis se váže na **jednotku**, plátce identifikuje **variabilní symbol**. Vazba na vlastníka přibude ve fázi 3 bez změny tohoto schématu.

## Cíl

Předpisy plateb a saldo per jednotka, za rozhraním `ReceivablesAdapter`, s interní implementací jako výchozí.

## Vytvoří / upraví

- `pnpm gen:feature receivables`
- `schema.ts`: `prescription`, `prescription_item`, `unit_balance_entry`
- `domain/ids.ts`, `types.ts`, `schemas.ts`, `events.ts`, `domain/period.ts` (`Period = { year, month }`, helpery)
- `adapters/receivables.adapter.ts` (rozhraní), `adapters/internal/index.ts` + soubory, `adapters/index.ts` (výběr podle `accounting_link.receivables_adapter` – tabulka `accounting_link` vzniká až v 024; do té doby konstanta `'internal'`; poznámka v README)
- `service/index.ts`, `receivables.service.ts`, `prescriptions.ts`, `balance.ts`, `vs.ts`
- `api/receivables.module.ts` (provider)
- `index.ts`, `README.md`, testy

## Rozhraní

Tabulky (`svjTable`):

- `prescription`: `unit_id uuid NOT NULL`, `year int`, `month int`, `variable_symbol text NOT NULL` (odvozen z čísla jednotky: `<svj pořadí 2 číslice><číslo jednotky doplněné na 4>`; funkce `variableSymbolFor(svj, unit)` v `domain/vs.ts`), `total_amount numeric(12,2)`, `due_date date`, `source prescription_source` (enum `internal`, `pohoda`). Unique `(tenant, svj, unit, year, month)`. Index `(tenant, svj, variable_symbol)`.
- `prescription_item`: `prescription_id`, `code text` (`fond_oprav`, `zalohy_sluzby`, `sprava`), `label text`, `amount numeric(12,2)`.
- `unit_balance_entry`: `unit_id`, `entry_date date`, `kind balance_entry_kind` (`prescription`, `payment`, `adjustment`), `amount numeric(12,2)` (předpis záporně, platba kladně), `reference_type text`, `reference_id uuid`. Index `(tenant, svj, unit_id, entry_date)`.

```ts
export interface ReceivablesAdapter {
  readonly kind: 'internal' | 'pohoda';
  listPrescriptions(ctx, { svjId, period }): Promise<Prescription[]>;
  findByVariableSymbol(ctx, { svjId, variableSymbol, period? }): Promise<Prescription | null>;
  unitBalance(ctx, { svjId, unitId, asOf? }): Promise<UnitBalance>;    // { unitId, balance, oldestUnpaidPeriod?, entries[] }
  listDebtors(ctx, { svjId, minDebt }): Promise<UnitBalance[]>;
  recordPayment(ctx, { svjId, unitId, amount, paidOn, reference }): Promise<void>;  // Internal zapíše entry; Pohoda (024+) deleguje
}
```

`InternalReceivablesAdapter` navíc `generatePrescriptions(ctx, { svjId, period, plan })` – z jednotek + podílu vytvoří předpisy (plan = sazby per kód: fond opr. za m², zálohy per jednotka).
Service `ReceivablesService` obaluje adapter + `audit.record` na každou mutaci. Eventy: `finance.prescription.generated` `{ svjId, period, count }`, `finance.payment.recorded` `{ svjId, unitId, amount, reference }`.

Subscriber `svj.unit.updated` **není** v rozsahu (podíly se v demu nemění).

## Testy

- RLS na všech třech tabulkách.
- `generatePrescriptions` pro SVJ s 12 jednotkami → 12 předpisů, součty odpovídají plánu, VS unikátní; opakované volání idempotentní (unique).
- `unitBalance`: předpis −3000, platba +3000 → 0; `listDebtors(minDebt 1)` vrátí jen dlužníky.
- Audit na `recordPayment`.

## Akceptační kritéria

`pnpm verify` zelený; adapter vybraný přes `adapters/index.ts` (žádná feature neimportuje `internal/` přímo – depcruise pravidlo obecně `feature-via-index-only` to nekryje uvnitř feature; přidej lint komentář do README).

## Mimo rozsah

Tooly, API, UI, seed (013). Pohoda implementace (fáze 1 ji nepotřebuje; rozhraní ano).

## Stav po dokončení

`ReceivablesService` s `findByVariableSymbol` a `recordPayment` pro `payments` (020).
