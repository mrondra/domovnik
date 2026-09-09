# 000 – Bootstrap workspace, tooling, docker compose

Reference: AGENTS.md, docs/engineering.md §1, ADR 0002.

## Cíl

Prázdné, ale plně hlídané monorepo: všechny nástroje nainstalované a zapojené, `pnpm verify` zelený, docker compose nastartuje infrastrukturu.

## Rozsah

1. `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `packages/features/*`, `tooling/*`), `.npmrc` (`strict-peer-dependencies`, `auto-install-peers=false`), `.nvmrc` = 22, `.editorconfig`, `.prettierrc` (single quotes, trailing commas, printWidth 110), `.prettierignore`, `.gitignore`.
2. Dev závislosti v rootu: typescript, typescript-eslint, eslint, eslint-plugin-boundaries, @vitest/eslint-plugin, prettier, dependency-cruiser, knip, lefthook, @commitlint/cli + config-conventional, turbo, tsx, vitest, gitleaks (přes lefthook, dokumentovat instalaci binárky). Zapoj existující `tooling/eslint/eslint.config.js` jako root `eslint.config.js` (re-export).
3. Prázdné packages s `package.json`, `tsconfig.json` (extends base), `src/index.ts` exportujícím alespoň jednu konstantu: `@domovnik/kernel`, `@domovnik/shared`, `@domovnik/db`. Prázdné `apps/` zatím nevytvářej.
4. Vitest workspace config (`vitest.workspace.ts`), projekty `unit` (`*.test.ts`), `integration` (`*.int.test.ts`, `*.contract.test.ts`, sekvenčně, `DATABASE_URL`), `evals` (`*.eval.ts`, mimo `test`, spouštěno `test:evals`). Coverage přes v8 s prahy z engineering.md §7 (kernel 90, features 80) – prahy nastav, i když zatím nic nepokrývají.
5. `docker-compose.yml`: `postgres` (pgvector/pgvector:pg16, port 5432, volume, healthcheck), `minio` (+ bucket init), `langfuse` (postgres pro langfuse zvlášť). `.env.example` se všemi proměnnými a komentářem u každé. Žádné secrets.
6. `pnpm verify` prochází na prázdném repu. `pnpm depcruise:graph` vygeneruje SVG (graphviz je optional dev nástroj, dokumentuj).
7. `lefthook install` přes `prepare`, ověř, že pre-commit skutečně blokuje commit s `console.log`.

## Mimo rozsah

Jakýkoli doménový kód. Kernel implementace. Apps.

## Akceptační kritéria

- `pnpm install && pnpm verify` zelený na čistém checkoutu (CI workflow projde).
- `docker compose up -d` → postgres, minio, langfuse healthy; `psql` vidí extension `vector`.
- Záměrně přidaný soubor s `console.log` neprojde pre-commit ani `pnpm lint`.
- Záměrně přidaný cyklický import mezi dvěma soubory v `packages/shared` spadne v `pnpm depcruise`.
- Report obsahuje seznam verzí hlavních závislostí.
