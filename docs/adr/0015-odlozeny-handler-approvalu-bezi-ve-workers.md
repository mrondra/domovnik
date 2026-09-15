# 0015 – Odložený handler approvalu běží ve workers

- Status: Accepted
- Date: 2026-09-13
- Deciders: Ondra

## Context

ADR 0006 rozhodlo, že tool s `approval.required` nikdy nespustí handler přímo a handler proběhne až
po rozhodnutí. Neřešilo **kde** ten handler poběží. Úkol 001 ho implementoval synchronně uvnitř
`approvals.decide()`, takže `POST /approvals/:id/decide` (úkol 004) čekal na jeho dokončení a vracel
jeho výstup.

To má tři provozní problémy, které úkol 005 pojmenovává (rozsah workers, bod 5):

1. Handler typicky sahá na externí systém (`accounting.postInvoice` → Pohoda mServer,
   `payment.createOrder` → banka). Timeout HTTP requestu znamená zapsané rozhodnutí a neprovedenou
   akci, kterou už nic nezkusí znovu.
2. Retry s backoffem na `AdapterError` s `retryable` nemá kde proběhnout.
3. Schvalování z e-mailu (zadání §3.4) je POST z mobilu; synchronní side effect je tam nejkřehčí.

## Decision

`approvals.decide()` pouze zapíše rozhodnutí, audit a emituje doménový event `approval.decided`.
Odložený handler spouští subscriber `approval-resume`, kterého hostují `apps/workers`.

- Jednorázovost rozhodnutí zůstává na podmíněném `UPDATE … WHERE status = 'pending'`.
- Jednorázovost **provedení** hlídá nový sloupec `approval.executed_at`; handler se spouští jen pro
  `executed_at IS NULL` a po úspěchu se zapíše spolu s `result` v jedné transakci.
- Handler běží v kontextu toho, kdo rozhodl (`decided_by` + aktuální role), ne jako `system`.
  Rozhodnutí bez známého aktéra (expirace, systémové rozhodnutí) běží jako `system`.
- `DecisionResult` už nenese `output`; `POST /approvals/:id/decide` vrací jen `{ status }`.

## Consequences

- Doručení je at-least-once, takže handler toolu musí být idempotentní. `executed_at` zachytí
  opakování po úspěchu; okno mezi během handleru a zápisem `executed_at` zavřít nelze a tool, který
  idempotentní není, je chyba toolu.
- Selhání handleru je nově asynchronní: job selže, pg-boss ho zopakuje, po vyčerpání pokusů zůstane
  approval `approved` s `executed_at IS NULL`. Dohledání takových approvalů je věc provozu
  (dead-letter fronta a úkol pro člověka jsou mimo rozsah 005).
- UI (úkol 006) nesmí čekat na výsledek akce; po rozhodnutí zobrazuje stav „schváleno, provádí se".
- `approval.decided` je od teď dostupný i ostatním features jako běžný doménový event.
- `apps/workers` musí běžet, aby se schválené akce provedly. Dřív stačilo API.

## Alternatives considered

**Nechat synchronně a bod 5 úkolu 005 vynechat** – nulová změna a dnes silnější záruka
(`UPDATE … WHERE status='pending'` dělá provedení exactly-once konstrukcí), ale ponechává všechny
tři problémy z kontextu a rozchází se se zadáním úkolu.

**Synchronně a workers jen dobírá spadlé handlery** – zachovalo by kontrakt API, ale vede ke dvěma
cestám k téže akci. Guard `result IS NULL` je nefunkční (je null i během synchronního běhu), takže
by stejně bylo potřeba stavové značení – víc mechaniky než tato varianta a horší korektnost.
