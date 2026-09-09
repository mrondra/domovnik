# Úkoly pro coding agenta – bootstrap monorepa

Pořadí je závazné, každý úkol končí zeleným `pnpm verify` a krátkým reportem (co, jak testováno, co jsem viděl a neřešil).
Před začátkem každého úkolu si přečti `AGENTS.md`, `docs/engineering.md` a ADR, na které úkol odkazuje.
Když něco nejde podle zadání, **zastav se a ptej se** (AGENTS.md §0). Neimplementuj nic mimo rozsah úkolu.

| #   | Úkol                                           | Výsledek                                                             |
| --- | ---------------------------------------------- | -------------------------------------------------------------------- |
| 000 | Bootstrap workspace + tooling + docker compose | prázdné repo, `pnpm verify` zelený                                   |
| 001 | `packages/kernel`                              | identita, kontext, DB/RLS, eventy, approvals, tooly, agenti, runtime |
| 002 | Generátory + custom ESLint pravidla + adr:new  | `pnpm gen:*` funguje                                                 |
| 003 | `packages/db`                                  | skládání schémat, migrace, seed runner                               |
| 004 | `apps/api` (NestJS)                            | auth, auto-registrace feature modulů, error mapping                  |
| 005 | `apps/workers` + `apps/mcp`                    | outbox → pg-boss → agent runtime; MCP s tokeny                       |
| 006 | `apps/web` (Next.js)                           | shell, přihlášení, SVJ switcher, inbox approvals                     |
| 007 | feature `svj`                                  | první feature end-to-end, vzor pro všechny další                     |
| 008 | Vrátit dočasné úpravy ESLint a Knip configu    | konfigurace odpovídá finálnímu stavu, `pnpm verify` zelený           |

Po 007 následuje fáze 1 ze zadání (invoices, payments, receivables, accounting-sync) – zadání vzniknou po revizi 007.
