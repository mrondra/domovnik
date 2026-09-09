# 002 – Generátory, custom ESLint pravidla, adr:new

Reference: AGENTS.md §3, §11 engineering.md, `tooling/eslint/eslint.config.js`.

## Cíl

Agent (ani člověk) nevymýšlí strukturu – generuje ji. Pravidla, která config už odkazuje, existují.

## Rozsah

1. `tooling/generators/feature.ts` – `pnpm gen:feature <name>`: vytvoří `packages/features/<name>/` s kostrou (index.ts, schema.ts se vzorovou `svjTable`, domain/{types,events}.ts, service/<name>.service.ts, api/<name>.module.ts, tests/<name>.int.test.ts s RLS testem šablonou, README.md 5 řádků), `package.json` (`@domovnik/feature-<name>`), `tsconfig.json`. Odmítne název mimo `kebab-case` a mimo seznam ve `commitlint.config.js` (přidá ho tam, pokud chybí – s dotazem).
2. `tooling/generators/tool.ts` – `pnpm gen:tool <feature> <name>`: `tools/<name>.ts` s `defineTool` šablonou (zod, permission, approval, handler volající service) + `tests/<name>.tool.test.ts` včetně approval testu pokud zvolena `--approval`.
3. `tooling/generators/agent.ts` – `pnpm gen:agent <feature> <name>`: `agents/<name>/agent.ts`, `prompt.md` se sekcemi Role/Kontext/Postup/Pravidla/Výstup (česky), `tests/<name>.agent.test.ts` (replay), `fixtures/llm/<name>/`.
4. `tooling/generators/adr.ts` – `pnpm adr:new "<title>"`: další číslo, slug, ze šablony, status Proposed.
5. Custom ESLint pravidla v `tooling/eslint/rules/`: `require-use-client` (soubor `*.client.tsx` musí začínat `"use client"`), `forbid-use-client` (ostatní tsx v `ui/` nesmí), `no-llm-in-loop` už existuje – přidej testy pravidel (`RuleTester`).
6. Generátory jsou idempotentní (odmítnou přepsat existující), testované (vitest, dočasný adresář).

## Akceptační kritéria

- `pnpm gen:feature demo && pnpm verify` zelený (včetně RLS testu ze šablony, který na prázdné tabulce projde), pak smazáno.
- `pnpm gen:tool demo ping --approval` vytvoří tool i test, test na approval projde proti kernel runtime.
- RuleTester testy pro tři custom pravidla.
- `pnpm adr:new "x"` vytvoří `docs/adr/0009-x.md`.
