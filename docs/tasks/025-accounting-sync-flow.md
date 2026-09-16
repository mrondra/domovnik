# 025 – accounting-sync: posting, likvidace, výpisy, konflikty, agent guard, UI

## Navazuje na

- 024, 009 (subscribers), 017 (`finance.invoice.approved`), 020/021 (`finance.payment.matched`, `BankAdapter`), 023 (UI vzor).

## Vytvoří / upraví

- `subscribers/post-invoice.ts`: `finance.invoice.approved` → `sync_job(post_invoice)` → `upsertSupplier` (pokud nemá ref) → `postReceivedInvoice` → `invoice.transition('posted', { accountingRef })` (přes `InvoicesService` – import z `packages/features/invoices/index`); `AdapterError.retryable` → pg-boss retry (ověř, jak kernel mapuje výjimku subscribera na retry; pokud nijak, zavolej to explicitně a popiš v reportu).
- `subscribers/liquidate.ts`: `finance.payment.matched` s `targetType='invoice'` → `liquidateInvoice`.
- `adapters/bank-from-accounting.ts` v **payments**? Ne – `BankAdapter kind 'pohoda'` patří do `payments/adapters/pohoda-bank.ts`, který volá `AccountingAdapter.fetchBankStatements` přes `packages/features/accounting-sync/index` (payments → accounting-sync import povolen; opačný směr jen přes eventy). Přepni synthetic generátor tak, aby zapisoval výpisy **do mock Pohody** a payments je četl odtud (zadání kap. 8: „primárně přes Pohodu"). `accounting_link.config.bankSource = 'pohoda'`.
- `service/conflicts.ts` + `subscribers/tick-daily.ts` (na `tick.daily`, ověř název v `packages/kernel/src/events/ticks.ts`): pro faktury `posted` porovná `fetchInvoice` s naší (částka, splatnost, VS) → `sync_conflict` + agentní event `finance.sync.conflict { svjId, conflictIds[] }`.
- `agents/accounting-sync-guard/`: trigger `finance.sync.conflict`, `autonomy: 'propose'`, tools `accounting.getConflict`, `invoice.get`, `accounting.proposeResolution` (`{ conflictId, resolution: 'keep_ours'|'take_theirs', note }`, approval finance) – **fáze 2 zavede úkoly; do té doby je výstupem approval**.
- Feature `demo`: scénář `pohoda_mutation` („Účetní změnila částku faktury v Pohodě") → `mock.mutateInvoice` + spuštění tick handleru.
- `api/accounting.controller.ts`: `GET /svj/:svjId/accounting` (link, poslední sync, joby, konflikty), `POST /svj/:svjId/accounting/sync-statements` ({from,to}), `POST /conflicts/:id/resolve` (manuální).
- `ui/AccountingStatusScreen.tsx` (stav napojení, fronta jobů, konflikty s diffem ours/theirs), navigace „Účetnictví" (finance, manager).
- Testy: subscriber integrace (approved → posted s ref; retry po `AdapterError`); likvidace; konflikt detekován a agent (replay) navrhne řešení; UI e2e: konflikt viditelný.

## Akceptační kritéria (= akceptace fáze 1 pro Pohodu)

- Schválení faktury zapíše do mock Pohody a faktura je `posted`; import výpisu s odpovídající platbou → `paid` + likvidace, bez agenta.
- Změna faktury přímo v (mock) Pohodě → konflikt + návrh ke schválení.

## Mimo rozsah

Reálný mServer, receivables z Pohody.

## Stav po dokončení

Celý řetězec faktura → schválení → Pohoda → platba → likvidace funguje.
