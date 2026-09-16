# 017 – invoices: tool `invoice.approve` s approval a agent `invoice-processor`

Reference: ADR 0006, 0012, 0015; zadání kap. 6.1, 7; `packages/kernel/src/agents/README.md`, `apps/workers/src/runtime/README.md`.

## Navazuje na

- 016 (eventy `finance.invoice.extracted`, `needs_review`; `extraction`, `checks` na faktuře).
- Kernel: `defineTool` s `approval`, `executeTool` → `Approval`, resume ve workers.

## Cíl

Agent, který pro fakturu ve stavu `extracted` připraví srozumitelný návrh pro výbor a založí approval; pro `needs_review` navrhne, co chybí, a založí úkol-náhradu (úkoly jsou fáze 2 → zatím `checks.reviewNote` + stav zůstává `needs_review`).

## Vytvoří / upraví

- `tools/get.ts` (`invoice.get` – faktura + extrakce + checks + smlouva + budgetStatus; readOnly)
- `tools/supplier-history.ts` (`invoice.supplierHistory` – posledních 12 faktur dodavatele pro SVJ: částky, data; readOnly)
- `tools/approve.ts` (`invoice.approve`):
  ```ts
  input: { invoiceId, summary: string (≤ 600 znaků, česky, pro výbor), recommendation: 'approve' | 'reject' | 'review', risks: string[] }
  permission: 'finance.approve', readOnly: false, proposal: true,
  approval: async (ctx, input) => ({ required: true, approvers: committeeOf(invoice.svjId), deadline: +7 dní })
  handler: transition(invoiceId, 'approved') → emit finance.invoice.approved   // běží až po rozhodnutí (ADR 0015); při rejected transition('rejected')
  ```
  Ověř, jak kernel při `rejected` zachází s handlerem – pokud handler po zamítnutí neběží, přidej subscriber `subscribers/on-approval-rejected.ts` na `approval.decided` s `decision='rejected'` a `toolName='invoice.approve'` → `transition('rejected')`.
  `executeTool` po založení approvalu: `transition(invoiceId, 'pending_approval', { approvalId })` – udělej to v handleru `proposal` fáze? Ne: udělej to v service metodě `requestApproval(ctx, invoiceId, approvalId)`, kterou zavolá tool wrapper **před** návratem `pending_approval` – ověř v `packages/kernel/src/tools/execute.ts`, zda tool má hook po založení approvalu; pokud ne, přidej do `ToolDefinition` volitelné `onApprovalRequested?(ctx, input, approvalId)` (kernel změna → zmínit v reportu, malé ADR není nutné, je to rozšíření kontraktu bez změny chování).
- `tools/flag-review.ts` (`invoice.flagReview`: `{ invoiceId, note, missing: string[] }` → uloží `checks.reviewNote`; `proposal: true`, bez approval)
- `agents/invoice-processor/agent.ts`, `prompt.md`, `README.md`
- `tests/invoice-processor.agent.test.ts` (replay), `tests/approve-tool.int.test.ts`, `tests/fixtures/llm/invoice-processor-*.json`

## Rozhraní agenta

```ts
defineAgent({
  name: 'invoice-processor',
  version: '1.0.0',
  description: 'Připraví schválení přijaté faktury pro výbor SVJ, nebo popíše, co chybí.',
  triggers: [{ event: 'finance.invoice.extracted' }, { event: 'finance.invoice.needs_review' }],
  scope: 'svj',
  model: 'sonnet',
  autonomy: 'propose',
  roles: ['finance'],
  tools: [
    'invoice.get',
    'invoice.supplierHistory',
    'document.get',
    'svj.get',
    'invoice.approve',
    'invoice.flagReview',
  ],
  prompt: promptFromFile(new URL('./prompt.md', import.meta.url)),
});
```

`prompt.md` (česky, sekce Role/Kontext/Postup/Pravidla/Výstup): agent **neověřuje** čísla znovu – bere `checks` jako fakt, píše shrnutí pro laika ve výboru (co, od koho, kolik, jak se to liší od obvyklého, co doporučuje), vždy volá právě jeden z `invoice.approve` / `invoice.flagReview`. Prompt nesmí obsahovat omezení, která vynucuje runtime.

## Testy

- Replay: `extracted` bez warningů → volání `invoice.approve` s `recommendation='approve'`, faktura v `pending_approval`, existuje `Approval` s approvers = výbor SVJ.
- Replay: `amount_deviates` → `approve` s `recommendation='review'` a `risks` neprázdné.
- Replay: `needs_review/supplier_unknown` → `invoice.flagReview`.
- Tool test: `invoice.approve` bez rozhodnutí nikdy nezmění stav na `approved`; po `decide(approved)` (spuštěno přes workers fixture jako v `apps/workers/src/tests/`) je stav `approved` a event `finance.invoice.approved` v outboxu; po `decide(rejected)` je `rejected`.
- Agent nedostane tool mimo seznam (kernel test už existuje – jen ověř, že `payment.*` v definici není).

## Akceptační kritéria

`pnpm verify` zelený; replay testy bez sítě; `agent_run` má `trace_id` a tokeny z fixtury.

## Mimo rozsah

API/UI, seed, příkaz k úhradě (Pohoda – 025).

## Stav po dokončení

Doručení PDF → `pending_approval` s `Approval` pro výbor bez zásahu člověka.
