# 021 – payments: `BankAdapter`, syntetický generátor, import endpoint

Reference: zadání kap. 8 (Banka), 020.

## Navazuje na

- 020 (`importTransactions`), 013 (předpisy 12 měsíců – generátor z nich odvozuje platby).

## Vytvoří / upraví

- `adapters/bank.adapter.ts`: `interface BankAdapter { kind: 'synthetic' | 'fio' | 'pohoda'; fetchTransactions(ctx, { bankAccountId, from, to }): Promise<IncomingTransaction[]> }`
- `adapters/synthetic/generator.ts` (deterministický podle seedu `svjId+period`: pro každý předpis období vytvoří platbu; profil per SVJ – A: 100 % platí včas, B: 3 jednotky neplatí vůbec, 2 platí s překlepem ve VS (prohozené číslice), 1 platí sdruženě 2 měsíce; C: 1 jednotka platí o 200 Kč méně; plus výdaje: úhrady faktur ve stavu `posted` k `due_on`), `adapters/synthetic/index.ts`, `adapters/index.ts`.
- `service/sync.ts`: `syncBankAccount(ctx, { bankAccountId, from, to })` → adapter → `importTransactions`.
- `api/bank.controller.ts`: `GET /svj/:svjId/bank-accounts`, `POST /svj/:svjId/bank-accounts/:id/sync` (body `{ from, to }`; permission `finance.write`; tag `demo` dokud existuje jen synthetic).
- `seed/bank-accounts.seed.ts`: primární účet per SVJ (z `svj.bankAccounts` – použij první hodnotu jako `number/bank_code`).
- Feature `demo`: scénář `bank_sync` („Načíst výpis za minulý měsíc") volající `syncBankAccount` pro všechna 3 SVJ.
- Testy: generátor deterministický (2× stejný výstup), profily podle popisu; `syncBankAccount` pro SVJ B za 1 měsíc → residuál ≥ 5.

## Akceptační kritéria

`pnpm verify` zelený; po seedu a sync za posledních 12 měsíců má SVJ A saldo 0 u všech jednotek, SVJ B 3 dlužníky s dluhem 12 měsíců.

## Mimo rozsah

Fio API (volitelné později), Pohoda výpisy (025 – tam se `kind: 'pohoda'` doplní).

## Stav po dokončení

Demo umí „načíst výpis"; existuje residuál pro agenta.
