# 041 – quotes: schéma a service poptávky

Reference: zadání kap. 4 (quote_request, quote), 7.

## Navazuje na

- 030 (`searchSuppliers`), 040 (`sendMail`), 011 (`documents`).

## Vytvoří / upraví

`pnpm gen:feature quotes`:

- `quote_request` (`svjTable`): `subject text`, `description text` (text poptávky pro dodavatele), `specialization text`, `related_type text NULL`, `related_id uuid NULL`, `status quote_request_status` (`draft`, `pending_approval`, `sent`, `evaluating`, `awarded`, `cancelled`), `response_deadline date`, `approval_id uuid NULL`, `created_by_agent_run_id uuid NULL`, `dedupe_key text NULL` (unique partial).
- `quote_request_recipient` (`svjTable`): `request_id`, `supplier_id`, `outbound_message_id uuid NULL`, `status recipient_status` (`pending`, `sent`, `responded`, `declined`, `no_response`). Unique `(tenant, request_id, supplier_id)`.
- `quote` (`svjTable`): `request_id`, `supplier_id`, `document_id`, `amount_total numeric(12,2) NULL`, `amount_vat numeric(12,2) NULL`, `earliest_date date NULL`, `valid_until date NULL`, `extraction jsonb NULL`, `status quote_status` (`received`, `accepted`, `rejected`).
- Service:
  ```ts
  candidateSuppliers(ctx, { svjId, specialization, limit = 5 }): Promise<Supplier[]>
    // searchSuppliers(activeOnly) → jen s e-mailem → bez dodavatelů, jejichž nabídka pro toto SVJ byla za 12 měsíců zamítnuta 2×
  createRequest(ctx, { svjId, subject, description, specialization, supplierIds, responseDeadline, related?, dedupeKey? })
    // status draft; supplierIds ⊆ candidateSuppliers, jinak DomainError('quote_supplier_not_candidate')
  markPendingApproval(ctx, id, approvalId)
  sendRequest(ctx, id)
    // pro každého příjemce sendMail(subject 'Poptávka: <subject> – <SVJ>', body = description + termín odpovědi + odkaz na odpověď e-mailem, related quote_request, dedupe 'quote_request:<id>:<supplier>') → recipient sent, request sent
  cancelRequest(ctx, id, reason)
  getRequest(ctx, id) → request + recipients + quotes; listRequests(ctx, { svjId?, status? })
  ```
  Eventy: `ops.quote_request.created`, `ops.quote_request.sent` `{ requestId, svjId, recipientCount }`, `ops.quote_request.cancelled`.
- Tooly (readOnly, userComposable, `ops.read`): `quote.getRequest`, `quote.candidates` (`{ svjId, specialization }`).
- `demo/reset.ts`.

## Testy

RLS 3 tabulek; `candidateSuppliers` vyloučí dodavatele bez e-mailu (seed 030) a opakovaně zamítnuté; `createRequest` s ne-kandidátem → chyba; `sendRequest` → 3 `outbound_message` a stav `sent`.

## Akceptační kritéria

`pnpm verify`.

## Mimo rozsah

Příjem nabídek (042), agenti (043, 044), UI (045).

## Stav po dokončení

Poptávku lze založit a odeslat kódem.
