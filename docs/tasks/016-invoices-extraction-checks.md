# 016 – invoices: extrakce (Haiku) a deterministické kontroly

Reference: ADR 0004 (kód první), `packages/kernel/src/llm/extract.ts`, `packages/kernel/src/testing/replay`.

## Navazuje na

- 015 (faktura ve stavu `received` s dokumentem), 014 (`findContractsForSupplier`, `budgetStatus`, `findSupplierByIco`).

## Cíl

Subscriber na `finance.invoice.received` udělá vše, co jde bez agenta: text z PDF → strukturovaná extrakce (Haiku) → dodavatel/smlouva/rozpočet → kontroly → stav `extracted` (vše jasné) nebo `needs_review` + agentní event (residuál).

## Vytvoří / upraví

- `service/extraction/text.ts` (`pdfText(buffer)` přes `pdf-parse`; když text < 50 znaků → `needs_review` důvod `pdf_no_text` – OCR není v rozsahu)
- `service/extraction/schema.ts` (zod `extractedInvoiceSchema`: `supplierName, supplierIco, supplierDic?, externalNumber, variableSymbol?, issuedOn, dueOn, amountTotal, amountVat?, currency, lines[]{description, quantity?, unitPrice?, amount}, bankAccount?`)
- `service/extraction/extract.ts` (`extractInvoice(ctx, invoiceId)` → `llm.extract({ model: 'haiku', schema, prompt })`; prompt v `service/extraction/prompt.md` česky)
- `service/checks/index.ts`, `supplier.ts`, `contract.ts`, `budget.ts`, `amount.ts`, `duplicate.ts`
- `subscribers/process-received.ts` (`subscribe('finance.invoice.received', …, { subscriber: 'invoices.process-received' })`)
- `tests/extraction.int.test.ts` s replay fixturami `tests/fixtures/llm/extract-*.json` (nahraj `LLM_MODE=record` na 3 vygenerovaných PDF: běžná úklidová faktura, faktura s jinou částkou než smlouva, faktura neznámého dodavatele), `tests/checks.test.ts` (unit, tabulkově)

## Rozhraní

`checks` (uloží se do `invoice.checks`):

```ts
type Check = { code: string; severity: 'info' | 'warning' | 'blocking'; message: string; data?: unknown };
// supplier_unknown (blocking) – IČO nenalezeno → needs_review
// contract_missing (warning) – dodavatel bez platné smlouvy pro SVJ
// amount_deviates (warning) – |amount − contract.monthly_amount| > 10 %
// budget_exceeded (warning) – remaining < amount
// due_soon (info) – due_on < 7 dní
// duplicate_number (blocking) – stejný supplier + external_number už existuje (unique index)
// vs_missing (info)
```

Rozhodnutí subscribera: `blocking` nebo `pdf_no_text` → `transition(needs_review, { extraction, checks })` + emit `finance.invoice.needs_review { invoiceId, svjId, reasons: codes }`. Jinak → `transition(extracted, { extraction, checks, supplierId, contractId, budgetCategory, … })` + emit `finance.invoice.extracted { invoiceId, svjId, warnings: codes }` – to je agentní event pro 017 (agent dostává i faktury bez warningů, protože připravuje shrnutí pro výbor; deterministicky by šlo schválení navrhnout i bez něj – zapiš do README, že v produkci by `warnings=[]` mohlo jít rovnou do approval).
Přidej `finance.invoice.extracted` do `domain/events.ts`.

## Testy

- Replay: 3 fixtury → očekávané stavy (`extracted` bez warningů; `extracted` s `amount_deviates`; `needs_review` s `supplier_unknown`).
- Unit checks: každá kontrola má pozitivní i negativní případ.
- Subscriber idempotentní (dvojí doručení → jedna extrakce; ověř přes `LLM` call count v replay).
- Žádné volání LLM v cyklu (lint `no-llm-in-loop` – řádky faktury nezpracovávat po jedné).

## Akceptační kritéria

`pnpm verify` zelený; `pnpm test` neběží proti síti (ověř `ANTHROPIC_API_KEY` prázdný v CI).

## Mimo rozsah

OCR, agent (017).

## Stav po dokončení

Faktura po doručení skončí v `extracted` nebo `needs_review` se strukturovanou extrakcí a kontrolami; agentní eventy `finance.invoice.extracted` / `needs_review` se emitují.
