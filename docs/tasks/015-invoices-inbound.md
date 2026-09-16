# 015 – invoices: příjem faktury (inbound mail adapter, simulace)

Reference: zadání kap. 8 (E-mail: simulovaná schránka), 014.

## Navazuje na

- 014 (`createInvoice`), 011 (`storeDocument`, `findBySha256`).

## Cíl

Faktura „přijde e-mailem": adapter pro příchozí poštu s jedinou implementací pro demo (`SimulatedInboundMail`), která přijme e-mail s PDF přílohou z API a dál je to stejná cesta jako reálný IMAP.

## Vytvoří / upraví

- `adapters/inbound-mail.adapter.ts` (rozhraní), `adapters/simulated-inbound-mail.ts`, `adapters/index.ts`
- `service/receive.ts`: `receiveInvoiceMail(ctx, mail: InboundMail)`
- `api/inbound.controller.ts`: `POST /svj/:svjId/invoices/inbound` (multipart: `from`, `subject`, `body`, soubor `attachment` PDF; permission `finance.write` nebo `tenant_admin`) – **demo/simulační endpoint**, označ v OpenAPI tagem `demo`.
- `tests/receive.int.test.ts`, `tests/inbound-api.int.test.ts`, `tests/fixtures/sample-invoice.pdf` (vygeneruj skriptem v testu přes `pdf-lib` – jednoduchá faktura s textem; nepřidávej binárku do gitu, generuj v `beforeAll`).

## Rozhraní

```ts
export interface InboundMail { readonly from: string; readonly subject: string; readonly text: string; readonly receivedAt: Date;
  readonly attachments: readonly { filename: string; contentType: string; body: Buffer }[]; }
export interface InboundMailAdapter { readonly kind: 'simulated' | 'imap'; /* imap až ve fázi 3 */
  poll?(ctx): Promise<InboundMail[]>; }
receiveInvoiceMail(ctx, { svjId, mail }): Promise<{ invoiceId: InvoiceId; duplicateOf?: InvoiceId }>
```

Postup `receiveInvoiceMail` (deterministický, bez LLM):

1. Vybere první přílohu `application/pdf` (jinak `DomainError 'inbound_no_pdf'`).
2. `sha256` → `findBySha256` v `documents`: existuje-li dokument kategorie `invoice` se stejným hashem, faktura se **nezakládá** a vrací se `duplicateOf` (najdi invoice podle `document_id`); zapíše audit `invoice.duplicate_rejected`.
3. `storeDocument(category 'invoice', source 'email', linkedEntity invoice)` → `createInvoice(source 'email')`; do `invoice.extraction` zatím `null`, do `checks` `{ mail: { from, subject } }`.
4. Emituje `finance.invoice.received` (dělá `createInvoice`).

## Testy

- Stejné PDF 2× → druhé volání vrátí `duplicateOf` a počet faktur je 1.
- Bez PDF přílohy → 422.
- API: role `committee` → 403; `finance` → 201 s `invoiceId`.

## Akceptační kritéria

`pnpm verify` zelený; endpoint v OpenAPI pod tagem `demo`.

## Mimo rozsah

IMAP, extrakce.

## Stav po dokončení

`POST /svj/:svjId/invoices/inbound` založí fakturu ve stavu `received` a emituje event.
