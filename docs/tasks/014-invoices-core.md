# 014 – invoices: schema a jádro service

Reference: zadání kap. 4 (Finance – supplier, contract, invoice, budget), kap. 7 (`invoice-processor` – co je kód), ADR 0004, 0011.

## Navazuje na

- 007 (`svj`), 011 (`documents`: `findBySha256`, `storeDocument`).

## Cíl

Tabulky a service pro dodavatele, smlouvy, rozpočet a fakturu se stavovým automatem. Ještě bez příjmu, extrakce a agenta.

## Vytvoří / upraví

- `pnpm gen:feature invoices`
- `schema.ts` (rozděl na `schema/index.ts`, `schema/suppliers.ts`, `schema/invoices.ts`, `schema/budget.ts` kvůli 100 řádkům; `packages/db` skládá `schema.ts` – ověř, že compose bere `schema.ts` i `schema/index.ts`, jinak `schema.ts` re-exportuje)
- `domain/ids.ts`, `types.ts`, `schemas.ts`, `events.ts`, `status.ts` (automat)
- `service/index.ts`, `invoices.service.ts`, `suppliers.ts`, `contracts.ts`, `budget.ts`, `invoice-records.ts`, `transitions.ts`
- `api/invoices.module.ts` (provider), `index.ts`, `README.md`, testy

## Rozhraní

`supplier` (`tenantTable`): `name`, `ico text NOT NULL`, `dic text NULL`, `bank_account text NULL`, `email text NULL`. Unique `(tenant, ico)`.
`contract` (`svjTable`): `supplier_id`, `subject text`, `budget_category text` (kód), `monthly_amount numeric(12,2) NULL`, `valid_from date`, `valid_to date NULL`, `document_id uuid NULL`.
`budget_line` (`svjTable`): `year int`, `category text` (`uklid`, `vytah`, `energie`, `opravy`, `revize`, `sprava`, `pojisteni`, `ostatni`), `planned_amount numeric(12,2)`. Unique `(tenant, svj, year, category)`.
`invoice` (`svjTable`): `status invoice_status` (enum `received, extracted, needs_review, pending_approval, approved, rejected, posted, paid`), `supplier_id uuid NULL`, `contract_id uuid NULL`, `document_id uuid NOT NULL`, `external_number text NULL`, `variable_symbol text NULL`, `issued_on date NULL`, `due_on date NULL`, `amount_total numeric(12,2) NULL`, `amount_vat numeric(12,2) NULL`, `currency text default 'CZK'`, `budget_category text NULL`, `extraction jsonb NULL`, `checks jsonb NULL` (výsledek deterministických kontrol), `agent_run_id uuid NULL`, `approval_id uuid NULL`, `accounting_ref text NULL` (pohoda id), `received_at timestamptz`, `source text`. Index `(tenant, svj, status)`, unique partial `(tenant, supplier_id, external_number) WHERE external_number IS NOT NULL`.
`invoice_line` (`svjTable`): `invoice_id`, `description`, `quantity numeric`, `unit_price numeric(12,2)`, `amount numeric(12,2)`.

`domain/status.ts`:

```ts
export const TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  received: ['extracted', 'needs_review'], extracted: ['needs_review', 'pending_approval'],
  needs_review: ['extracted', 'pending_approval', 'rejected'], pending_approval: ['approved', 'rejected'],
  approved: ['posted'], posted: ['paid'], rejected: [], paid: [],
};
export const assertTransition = (from, to): void; // DomainError 'invoice_transition_invalid'
```

Service (každá mutace: `withTenant` + `audit.record` + event):

```ts
createSupplier / findSupplierByIco / listSuppliers
createContract / findContractsForSupplier(ctx, { svjId, supplierId, on: Date })
setBudgetLine / budgetStatus(ctx, { svjId, year, category }) → { planned, spent (součet approved+posted+paid faktur), remaining }
createInvoice(ctx, { svjId, documentId, source, receivedAt }) → status received; event finance.invoice.received { invoiceId, svjId, documentId }
transition(ctx, invoiceId, to, patch?) → assertTransition; event finance.invoice.<to> pro approved, rejected, posted, paid
getInvoice / listInvoices(ctx, { svjId?, status? })  // respektuje svjScope
```

Eventy v `domain/events.ts`: `finance.invoice.received`, `finance.invoice.needs_review` `{ invoiceId, svjId, reasons[] }` (agentní event – 016), `finance.invoice.approved` `{ invoiceId, svjId, supplierId, amountTotal, dueOn, variableSymbol, budgetCategory }`, `finance.invoice.rejected`, `finance.invoice.posted` `{ invoiceId, accountingRef }`, `finance.invoice.paid`.

## Testy

- RLS na 5 tabulkách.
- Automat: každý povolený přechod projde, nepovolený vyhodí `invoice_transition_invalid` (tabulkový test).
- `budgetStatus`: spent počítá jen approved/posted/paid.
- `findContractsForSupplier` respektuje `valid_from/valid_to`.
- Audit u každé mutace.

## Akceptační kritéria

`pnpm verify` zelený; `pnpm db:migrate` z čisté DB projde.

## Mimo rozsah

Příjem (015), extrakce (016), agent (017), API/UI (018), seed (019).

## Stav po dokončení

`createInvoice` + `transition` + `budgetStatus` + `findContractsForSupplier` k dispozici.
