# 044 – quotes: agent `quote-evaluator`, přidělení zakázky

## Navazuje na

- 042 (`ops.quote_request.ready_for_decision`, `quote.compare`), 043.

## Vytvoří / upraví

- `quotes/tools/propose-award.ts` – `quote.proposeAward`:
  ```ts
  input: { requestId, quoteId, summary (≤ 600 znaků pro výbor), reasoning: string[], risks: string[] }
  permission: 'ops.write', proposal: true,
  approval: → { required: true, approvers: výbor SVJ (helper committeeOfSvj – přesuň logiku z invoices `committeeOf` do `svj` jako `committeeOf(ctx, svjId)` a invoices ho použije), deadline +7 dní }
  onApprovalRequested: nic (poptávka už je `evaluating`)
  handler: awardQuote(requestId, quoteId)
  ```
- `service/award.ts`: `awardQuote` → vybraná `accepted`, ostatní `rejected`, request `awarded` → `sendMail` vítězi („Potvrzení objednávky") a ostatním („Děkujeme za nabídku") → emit `ops.quote.awarded` `{ requestId, quoteId, svjId, supplierId, related, earliestDate }`.
- `inspections/subscribers/on-quote-awarded.ts`: `related.type = 'inspection_plan'` → otevřená revize plánu dostane `supplier_id` + úkol „Domluvit termín" (stejný jako v 038, dedupe `inspection:<id>:schedule`).
- Evidence renderer pro `quote.proposeAward` (tabulka z `quote.compare` + shrnutí + rizika).
- `quotes/agents/quote-evaluator/agent.ts`: trigger `ops.quote_request.ready_for_decision`, `scope: 'svj'`, `model: 'sonnet'`, `autonomy: 'propose'`, `roles: ['manager']`, tools `quote.getRequest`, `quote.compare`, `document.get`, `suppliers.get`, `quote.proposeAward`. Prompt: doporučuje z tabulky `quote.compare`, nepočítá ceny znovu, u nejlevnější nabídky s chybějícími údaji (`missingFields`) to uvede v rizicích; vždy právě jedno `proposeAward`.
- Replay test: 2 nabídky (levnější s delším termínem) → `proposeAward` na jednu z nich, `quoteId` ∈ nabídky poptávky; po schválení výborem: `awarded`, 2 odchozí e-maily, revize má dodavatele a úkol.

## Akceptační kritéria

`pnpm verify`; `invoices` testy zelené po přesunu `committeeOf`.

## Stav po dokončení

Celá smyčka revize → poptávka → nabídky → výbor → dodavatel → úkol na termín.
