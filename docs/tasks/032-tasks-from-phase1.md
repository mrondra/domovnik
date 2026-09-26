# 032 – tasks: úkoly z fáze 1 (needs_review, konflikt, selhání agenta)

Reference: README-faze-1 „Co zůstalo otevřené" (úkoly); zadání kap. 7 (`accounting-sync-guard` → úkol pro finance).

## Navazuje na

- 031 (`createTask`, `closeTasksForOrigin`), `pnpm gen:subscriber`.
- Eventy: `finance.invoice.needs_review` (`invoiceNeedsReview`), `finance.invoice.approved`, `finance.invoice.rejected`, `finance.sync.conflict` (`syncConflictDetected` – `{ svjId, conflictIds[] }`), `agent.run.failed` (`agentRunFailed` z kernelu).

## Vytvoří / upraví

Subscriber žije ve feature, která vlastní původ (README-faze-2):

- `invoices/subscribers/needs-review-task.ts` (`invoices.needs-review-task`): `createTask({ svjId, title: 'Zkontrolovat fakturu <dodavatel|neznámý> <číslo>', description: přehled důvodů česky (popisky kódů z `domain/checks`), priority: blocking → 'high', jinak 'normal', departmentCode: 'finance', dueOn: +2 pracovní dny, origin: { type: 'invoice', id }, dedupeKey: 'invoice:<id>:needs_review' })`.
- `invoices/subscribers/close-review-task.ts`: na `finance.invoice.approved` i `rejected` → `closeTasksForOrigin({ type: 'invoice', id }, { status: 'done', note: 'Faktura byla schválena|zamítnuta' })`. (Pokud už existuje subscriber na `approved`, přidej nový soubor – jeden subscriber = jedna odpovědnost.)
- `accounting-sync`: nový event `finance.sync.conflict_resolved` `{ svjId, conflictId, resolution }` emitovaný z `resolveConflict` (ruční i po approvalu `accounting.proposeResolution`).
- `accounting-sync/subscribers/conflict-tasks.ts`: na `finance.sync.conflict` jeden `createTask` **per konflikt** (dávka → N úkolů v jedné transakci; `dedupeKey: 'sync_conflict:<id>'`, origin `sync_conflict`, priority `high`, department `finance`, popis: pole, naše hodnota, hodnota v Pohodě). Approval od agenta zůstává – úkol je místo, kde finance vidí, že je co řešit.
- `accounting-sync/subscribers/close-conflict-task.ts`: na `conflict_resolved` → `closeTasksForOrigin`.
- `tasks/subscribers/agent-failed-task.ts`: na `agent.run.failed` → úkol pro `administration`, priority `high` (`failed_budget`) / `normal`, origin `agent_run`, dedupe `agent_run:<id>`, popis obsahuje agenta a zprávu. Kontext tenanta z eventu.

## Testy

- Každý subscriber: integrační test „event → úkol" a „dvojí doručení → jeden úkol".
- Konflikt se dvěma id → 2 úkoly; `resolveConflict` jednoho → 1 úkol `done`.
- Faktura `needs_review` → úkol; po `approved` úkol `done`.
- `agent.run.failed` s `failed_budget` → úkol `high` v oddělení Správa.
- `phase1.e2e.ts` zelený (e2e krok s konfliktem může ověřit i úkol – jen pokud je to jednořádková změna).

## Akceptační kritéria

`pnpm verify`; řádek „Úkoly" v „Co zůstalo otevřené" v README-faze-1 přeškrtnutý s odkazem na 032.

## Mimo rozsah

UI (034).

## Stav po dokončení

Fáze 1 končí úkoly tam, kde zadání úkoly čeká.
