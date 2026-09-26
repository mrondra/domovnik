# 043 – inspections: agent `inspection-planner` + tool `quote.proposeRequest`

Reference: ADR 0006, 0012, 0015; vzor agenta `packages/features/invoices/agents/invoice-processor/`, tool s approvalem `invoices/tools/approve.ts`.

## Navazuje na

- 038 (`ops.inspection.due_soon` `{ svjId, planIds[] }`), 041/042 (poptávky).

## Vytvoří / upraví

- `quotes/tools/propose-request.ts` – `quote.proposeRequest`:
  ```ts
  input: { svjId, subject, description (≤ 2000 znaků, česky, text e-mailu dodavateli), specialization,
           supplierIds (2–4), responseDeadline (date, 5–21 dní od dneška), related?: { type, id } }
  permission: 'ops.write', readOnly: false, proposal: true, userComposable: true,
  approval: → { required: true, approvers: usersWithRole(ctx, 'manager') }
  onApprovalRequested: createRequest(… dedupeKey 'agent:<runId>:<related>') → markPendingApproval
  handler (po schválení): sendRequest(requestId) → emit
  ```
  Po zamítnutí → `cancelRequest` (subscriber na `approval.decided` jako `invoices/subscribers/on-approval-rejected.ts`).
  Evidence renderer v `quotes/ui/evidence` (příjemci, text, termín).
- `inspections/subscribers/link-quote-request.ts`: na `ops.quote_request.created` s `related.type = 'inspection_plan'` → `planInspection({ planId, quoteRequestId, dedupeKey 'plan:<id>:<next_due_on>' })` (revize `planned` bez dodavatele – sweep 038 ji pak neposílá znovu).
- `inspections/agents/inspection-planner/agent.ts`:
  ```ts
  triggers: [{ event: 'ops.inspection.due_soon' }], scope: 'svj', model: 'sonnet', autonomy: 'propose', roles: ['manager'],
  tools: ['inspection.listPlans', 'svj.get', 'quote.candidates', 'suppliers.get', 'quote.proposeRequest', 'task.create']
  ```
  `prompt.md` (česky): pro každý plán z dávky jeden `quote.proposeRequest` (bere kandidáty výhradně z `quote.candidates`; když jsou < 2, místo poptávky `task.create` pro `administration` „Chybí dodavatelé pro <obor>"). Text poptávky: co, kde (adresa, budova, počet vchodů/jednotek z `svj.get`), do kdy je revize nutná, požadované přílohy (oprávnění, cena, termín). Nevymýšlí technické parametry, které nemá.
- Replay test `inspections/tests/inspection-planner.agent.int.test.ts`: dávka se 2 plány (hromosvod SVJ A, hasicí přístroje SVJ C – různá SVJ → dva běhy, každý se svou dávkou) → po jednom `proposeRequest`, approval pro managera, revize `planned` s `quote_request_id`; varianta s 1 kandidátem → `task.create`.
- Tool test: `quote.proposeRequest` s dodavatelem mimo kandidáty → chyba z `createRequest` vrácená modelu jako tool error; bez schválení se nic neodešle (0 `outbound_message`).

## Akceptační kritéria

- Scénář „Blíží se revize hromosvodu" → do 30 s v inboxu managera návrh poptávky se 2–4 dodavateli (e2e přijde v 055; zde ruční ověření popiš v reportu).
- `pnpm verify`.

## Stav po dokončení

Akceptační kritérium fáze 2 č. 1 (revize → poptávka ke schválení) splněno.
