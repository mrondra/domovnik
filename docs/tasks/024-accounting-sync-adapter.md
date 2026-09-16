# 024 – accounting-sync: `AccountingAdapter`, `PohodaMockAdapter`, contract testy

Reference: ADR 0005; zadání kap. 8 (Pohoda); `packages/kernel/src/testing/contract.ts` (`describeAdapterContract`).

## Navazuje na

- 014 (typy faktury), 020 (transakce). Ověření XML na POHODA Start je předpoklad – pokud nebylo provedeno, adapter piš podle veřejné dokumentace `dataPack` (verze schématu 2.x) a **zapiš do README, které elementy jsou neověřené**.

## Vytvoří / upraví

- `pnpm gen:feature accounting-sync`
- `schema.ts`: `accounting_link` (`svjTable`: `accounting_adapter` enum `mock|mserver`, `receivables_adapter` enum `internal|pohoda_other_receivables`, `company_ico`, `last_sync_at`, `config jsonb`), `sync_job` (`svjTable`: `kind` enum `post_invoice|liquidate|import_statements|import_receivables`, `status` enum `pending|running|done|failed`, `payload jsonb`, `result jsonb`, `error text`, `attempts int`), `sync_conflict` (`svjTable`: `entity_type`, `entity_id`, `field`, `ours jsonb`, `theirs jsonb`, `status` enum `open|resolved`, `resolution text`).
- `adapters/accounting.adapter.ts`:
  ```ts
  export interface AccountingAdapter {
    readonly kind: 'mock' | 'mserver';
    postReceivedInvoice(ctx, inv: PostInvoiceInput): Promise<{ accountingRef: string }>; // XML inv:invoice
    liquidateInvoice(ctx, { accountingRef, amount, paidOn, bankRef }): Promise<void>; // XML liq:liquidation
    fetchBankStatements(ctx, { accountIco, from, to }): Promise<BankStatementLine[]>; // XML lStk (výpis)
    fetchInvoice(ctx, accountingRef): Promise<AccountingInvoice | null>; // pro detekci konfliktu
    upsertSupplier(ctx, supplier): Promise<{ accountingRef: string }>; // adresář
  }
  ```
- `adapters/pohoda/xml/` – `data-pack.ts` (obálka `dat:dataPack` s `ico`, `application`, `version`), `invoice.ts` (`inv:invoice` – `invoiceType receivedInvoice`, číselná řada, symVar, datum, partner, částky, členění DPH; předkontace `preduc:ids` konstantní z configu), `liquidation.ts`, `bank-statement.ts`, `parse.ts` (`fast-xml-parser`, `responsePack` → výsledek/chyba), `builders.ts`.
- `adapters/pohoda/mock/`: in-memory „Pohoda" – uchovává přijaté dataPacky, generuje `responsePack` s `id` a číslem dokladu, umí `fetchInvoice` vrátit, co bylo zapsáno, a **admin metodu** `mutateInvoice(ref, patch)` pro simulaci změny mimo aplikaci (použije 025 pro konflikt). Perzistence: tabulka `pohoda_mock_store` (`svjTable`, `ref`, `kind`, `xml text`, `state jsonb`) – aby demo přežilo restart.
- `adapters/pohoda/mserver/` – jen `client.ts` s HTTP voláním mServeru (`POST /xml`, Basic auth, `STW-Application`, `STW-Authorization` hlavičky) + `TODO` na ověření; není v testech.
- `adapters/index.ts` – výběr podle `accounting_link`.
- `tests/accounting.contract.test.ts` (`describeAdapterContract`: post → fetch vrací stejné hodnoty; liquidate → fetch má `paid`; statements → řádky se stabilním `external_id`), běží proti mocku vždy, proti mserver s `POHODA_MSERVER_URL`.
- `tests/xml.test.ts` – snapshoty XML pro 3 faktury; parsování chybového `responsePack`.

## Akceptační kritéria

- Contract test proti mocku zelený; XML snapshoty validní vůči `dataPack` XSD, pokud je XSD dostupné offline (přidej do `tests/fixtures/xsd/` jen když je licenčně v pořádku – jinak validuj strukturu ručně a napiš to).
- `pnpm verify` zelený.

## Mimo rozsah

Subscribery, konflikty, UI (025). Pohoda receivables adapter (fáze 3).

## Stav po dokončení

`AccountingAdapter` s mockem, XML builder/parser, `accounting_link` per SVJ.
