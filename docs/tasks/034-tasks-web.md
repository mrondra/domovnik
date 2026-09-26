# 034 – tasks: web (moje úkoly, oddělení, detail, odkazy na původ)

Reference: ADR 0017; vzor `packages/features/payments/ui/*`, `apps/web/src/api/payments.ts`, skládání `pnpm web:navigation`.

## Navazuje na

- 33.

## Vytvoří / upraví

- `tasks/ui/`: `MyTasksScreen.tsx` (moje otevřené, seřazené: urgentní, po termínu, termín), `DepartmentBoardScreen.tsx` (sloupce podle stavu, filtr oddělení a SVJ, nepřiřazené zvýrazněné), `TaskDetailScreen.tsx` (popis, stav, priorita, termín, přiřazení, historie activity, odkaz na původ), `TaskStatusControl.client.tsx`, `TaskCommentForm.client.tsx`, `TaskAssignControl.client.tsx` („Převzít" pro `tasks.update`, výběr člena oddělení pro `tasks.write`), `PriorityBadge.tsx`, `labels.ts`, `wire.ts`, `navigation.ts` („Úkoly" – tenant úroveň pro všechny role kromě owner; pod SVJ „Úkoly" filtrované na SVJ).
- **Odkazy na původ** – nový skládaný registr stejně jako evidence: každá feature může v `ui/index.ts` exportovat `taskOriginLinks: Record<string, (origin: { id: string; svjId: string | null }) => { label: string; path: string }>`. `pnpm web:navigation` složí `apps/web/src/tasks/origin-links.generated.ts`. Dodej linky: `invoices` (`invoice` → detail faktury), `accounting-sync` (`sync_conflict` → stav účetnictví), `tasks` (`agent_run` → approval inbox s filtrem? Pokud stránka běhu agenta neexistuje, label „Běh agenta <krátké id>" bez odkazu – `path` pak `null`; uprav typ na `path: string | null`).
- `apps/web/src/api/tasks.ts`, stránky `apps/web/src/app/(tenant)/tasks/page.tsx` (moje), `(tenant)/tasks/board/page.tsx`, `(tenant)/tasks/[id]/page.tsx`, `s/[svjId]/tasks/page.tsx`.
- Server actions pro stav/komentář/přiřazení (vzor `apps/web/src/actions/approvals.ts`).
- Playwright `apps/web/e2e/tasks.e2e.ts`: finance → moje úkoly (po scénáři s `needs_review` fakturou) → detail → odkaz na fakturu → zpět → stav „Hotovo".

## Akceptační kritéria

- Úkol z konfliktu (032) má funkční odkaz na obrazovku účetnictví.
- Committee nevidí tlačítka mutací a tenant úroveň úkolů.
- `pnpm build`, e2e zelené.

## Stav po dokončení

Úkoly jsou vidět a ovladatelné v UI; registr odkazů na původ existuje.
