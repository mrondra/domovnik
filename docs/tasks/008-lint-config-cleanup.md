# 008 – Vrátit dočasné úpravy ESLint a Knip configu

Reference: AGENTS.md, docs/engineering.md §1.

## Kontext

Během úkolu 000 (bootstrap) bylo potřeba upravit `tooling/eslint/eslint.config.js` a `knip.json`, aby `pnpm verify` prošel na prázdném repu. Tyto konfigurace jsou navržené pro finální stav projektu (s `apps/*`, `packages/features/*`, atd.) a dočasné úpravy je třeba vrátit, jakmile příslušné adresáře a soubory existují.

## Co bylo změněno v 000

### `tooling/eslint/eslint.config.js`

- Přidány ignores: `**/*.cjs`, `tooling/**`, `eslint.config.js`, `commitlint.config.js`, `vitest.workspace.ts`
- Důvod: ESLint s `projectService: true` nemohl najít tyto soubory v žádném tsconfig

### `packages/*/package.json` (kernel, shared, db)

- Přidáno `--passWithNoTests` do skriptu `test`
- Důvod: vitest padá s exit code 1, když nenajde žádné testy

### `knip.json`

- Odebrány workspace patterny `apps/*` a `packages/features/*` (adresáře neexistovaly)
- Odebrány entry patterny pro `packages/db` (`src/seed.ts`, `drizzle.config.ts` — soubory neexistovaly)
- Odebráno pravidlo `"unused": "error"` (neplatné v aktuální verzi knip)
- Přidáno `"ignoreBinaries": ["dot"]`

## Rozsah

1. **ESLint:** Odebrat dočasné ignores. Root config soubory zpřístupnit ESLintu jedním z:
   - `allowDefaultProject` v parserOptions (doporučený postup typescript-eslint)
   - Root `tsconfig.json` s `include` pro config soubory
   - Nebo jiný přístup, který neomezuje coverage lintování

2. **Knip:** Vrátit workspace patterny `apps/*` a `packages/features/*` a entry patterny pro `packages/db`, jakmile příslušné adresáře/soubory existují. Opravit pravidlo `"unused"` na platný název v aktuální verzi knip.

3. **Vitest:** Odebrat `--passWithNoTests` z `packages/*/package.json`, jakmile každý package má alespoň jeden test.

4. `pnpm verify` musí po změnách projít.

## Kdy spustit

Po dokončení úkolů, které vytvoří chybějící struktury — nejpozději po 007 (první feature end-to-end).

## Akceptační kritéria

- `tooling/eslint/eslint.config.js` neobsahuje dočasné ignores z 000
- `knip.json` obsahuje všechny původně zamýšlené workspace a entry patterny
- `pnpm verify` zelený
- Žádný source soubor v repu není vyloučený z lintování
- `--passWithNoTests` se nepoužívá v žádném package.json
