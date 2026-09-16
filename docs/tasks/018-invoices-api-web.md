# 018 – invoices: API a web (seznam, detail s evidencí)

Reference: ADR 0017; vzory `packages/features/svj/api/*`, `packages/features/svj/ui/*`, `apps/web/src/api/svj.ts`, `apps/web/src/approvals/*` (detail approvalu s evidencí).

## Navazuje na

- 017 (faktury ve všech stavech, `Approval` s `input.summary`).

## Vytvoří / upraví

- `api/invoices.controller.ts`: `GET /svj/:svjId/invoices?status=`, `GET /invoices/:id` (detail: faktura, extrakce, checks, dodavatel, smlouva, budgetStatus, `agentRun` `{ id, status, traceId, model, tokens }`, `approval` `{ id, status, summary, recommendation, risks }`, `document.downloadUrl`), `GET /invoices?status=` (cross-SVJ pro `manager`/`finance`, respektuje `svjScope`); `api/invoices.schema.ts`.
- `api/suppliers.controller.ts`: `GET /suppliers`, `GET /svj/:svjId/contracts`.
- `ui/index.ts`, `ui/navigation.ts` (položka „Faktury" pod SVJ, cross-SVJ „Faktury" pro manager/finance), `ui/InvoiceListScreen.tsx`, `ui/InvoiceDetailScreen.tsx`, `ui/InvoiceStatusBadge.tsx`, `ui/ChecksList.tsx`, `ui/AgentEvidence.tsx` (shrnutí agenta, doporučení, rizika, odkaz na approval, odkaz na Langfuse trace pokud `LANGFUSE_BASE_URL`), `ui/labels.ts` (české popisky stavů a kódů kontrol).
- `apps/web/src/api/invoices.ts`, stránky `apps/web/src/app/s/[svjId]/invoices/page.tsx`, `.../invoices/[id]/page.tsx`, `apps/web/src/app/(tenant)/invoices/page.tsx`.
- Detail approvalu (`apps/web/src/approvals/Evidence.tsx`) – pokud `toolName === 'invoice.approve'`, zobrazí `summary/recommendation/risks` čitelně místo raw JSON: udělej to obecně přes registr „evidence rendererů" exportovaný z `ui/index.ts` feature (`approvalEvidenceRenderers: { 'invoice.approve': Component }`) a složený v `apps/web` stejně jako navigace (`compose-navigation` → přidej `compose-evidence` nebo rozšiř stávající compose; zvol menší změnu, popiš v reportu).
- Testy: `tests/api.int.test.ts`; Playwright `apps/web/e2e/invoices.e2e.ts` (login finance → seznam → detail → odkaz na approval).

## Akceptační kritéria

- Committee SVJ A nevidí faktury B (API i UI).
- Detail zobrazuje shrnutí agenta a kontroly s českými popisky; stav se mění po schválení v inboxu (e2e).
- `pnpm build` web bez chyb; `next build` nevtáhne Nest (ADR 0017 – ověř, že `ui/index.ts` neexportuje nic ze `service/`).

## Mimo rozsah

Ruční založení faktury z UI, editace extrakce (fáze polish).

## Stav po dokončení

Faktury viditelné a schvalitelné v UI.
