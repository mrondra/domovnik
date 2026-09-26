# 042 – quotes: příjem nabídky, porovnání, scénář

Reference: 016 (extrakce faktury jako vzor), ADR 0004.

## Navazuje na

- 41.

## Vytvoří / upraví

- `service/receive.ts`: `receiveQuote(ctx, { requestId, supplierId, pdf: Buffer, filename })` → `storeDocument(category 'quote')` (kategorii `quote` přidej do enumu `document_category` v `documents` – aditivní migrace) → quote `received` + recipient `responded` → emit `ops.quote.received` `{ quoteId, requestId, svjId }`. Nabídka od nepozvaného dodavatele → `DomainError('quote_not_invited')`.
- `subscribers/extract-quote.ts` (`quotes.extract`): `pdfText` (přesuň z `invoices/service/extraction/text.ts` do `packages/shared/src/pdf/text.ts` – nemá doménu – a `invoices` přepni na něj) → `llm.extract(ctx, quoteExtractionSchema, { model: 'haiku', prompt })`: `amountTotal`, `amountVat?`, `earliestDate?`, `validUntil?`, `scopeSummary`, `exclusions[]`, `paymentTerms?` → uloží na quote.
- `service/readiness.ts` + `subscribers/check-ready.ts` (na `ops.quote.received` a `tick.daily`): poptávka je připravená k rozhodnutí, když všichni příjemci `responded|declined` **nebo** uplynul `response_deadline` a existuje ≥ 1 nabídka (neodpovězení → `no_response`). Pak status `evaluating` + agentní event `ops.quote_request.ready_for_decision` `{ requestId, svjId }` (jednou – přechod stavu je pojistka). Uplynulý termín bez nabídek → úkol `administration` „Poptávka bez nabídek" (dedupe).
- `service/compare.ts` – **porovnání kódem**: `compareQuotes(ctx, requestId)` → řádky `{ quoteId, supplier, amountTotal, earliestDate, validUntil, isCheapest, isFastest, missingFields[], expired, activeContracts: number }` (počet aktivních smluv dodavatele v tenantu ze `suppliers`; `quotes` na `invoices` nezávisí, historii faktur proto nepoužívá). Tool `quote.compare` (readOnly, `ops.read`).
- `quotes/demo/quote-replies.ts` – kind `quote_replies`, payload `{ requestCode?: string }`: najde nejnovější poptávku ve stavu `sent` (volitelně podle subjectu), pro každého příjemce kromě posledního vygeneruje PDF nabídky (`pdf-lib`, vzor generátoru faktur ze seedu invoices; různé ceny ±20 %, jeden dodavatel s delším termínem) a zavolá `receiveQuote`; poslední příjemce `declined`. Seed zaregistruje scénář „Dodavatelé odpověděli na poptávku".
- Replay fixtury `tests/fixtures/llm/quote-extract-*.json` pro 3 vygenerované nabídky.

## Testy

- Příjem od nepozvaného → chyba; extrakce v replay; `compareQuotes` označí nejlevnější a nejrychlejší; readiness: 2 odpovědi + 1 decline → jeden event; druhý `ops.quote.received` → žádný další event.
- `invoices` testy extrakce zelené po přesunu `pdfText`.

## Akceptační kritéria

`pnpm verify`.

## Stav po dokončení

Nabídky se přijímají, čtou a porovnávají kódem; `ready_for_decision` existuje.
