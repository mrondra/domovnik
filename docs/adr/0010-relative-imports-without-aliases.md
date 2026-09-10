# 0010 – Relativní importy bez přípony a bez aliasů

- Status: Accepted
- Date: 2026-09-10
- Deciders: Ondra
- Supersedes: 0009

## Context

ADR 0009 zrušilo `.js` specifikátory (`module: Preserve`), ale cross-package importy nechalo na aliasech `@domovnik/*` z `paths` v `tsconfig.base.json`. Alias skrývá, kam import doopravdy míří, a mapování by muselo existovat zvlášť v tsconfigu, ve Vitest, v Next.js a v produkčním bundleru – čtyři místa, která se můžou rozejít. Rozhodnutí padlo při revizi bootstrap commitu.

## Decision

Všechny importy jsou relativní a bez přípony. `tsconfig.base.json` nemá `paths`, žádný alias neexistuje.

```ts
// packages/features/invoices/service/invoice.service.ts
import { toInvoice } from '../domain/mappers';
import { withTenant } from '../../../kernel/src/db';
import { svjService } from '../../svj';
```

Názvy workspace balíčků (`@domovnik/kernel`, `@domovnik/shared`, `@domovnik/db`) zůstávají – používá je `pnpm --filter`, turbo a knip. Přes jméno balíčku se ale neimportuje.

## Consequences

- Žádné mapování cest v žádném nástroji. tsc, Vite/Vitest, Next.js i bundler resolvují importy stejně, bez konfigurace.
- Z hloubky feature vedou k jádru cesty typu `../../../kernel/src/db`. Je to daň za to, že cesta odpovídá tomu, co je na disku.
- Hranice mezi features (`index.ts` jako jediný veřejný vstup) hlídají `boundaries/dependencies` a `dependency-cruiser` nad **rozřešenými** cestami. Textový `no-restricted-imports` pattern na `@domovnik/features/*/…` tím ztratil smysl a byl odstraněn – na relativním importu by nezachytil nic a tvářil by se jako pojistka.
- `eslint-import-resolver-typescript` zůstává nutný: bez něj se přípona `.ts` nerozřeší a `boundaries/*` tiše propustí všechno (ověřeno).
- `packages/*/package.json` dál exportují `./src/index.ts`; import přes jméno balíčku je tím pádem možný technicky, ale konvence ho zakazuje.
- Platí i `module: Preserve` z 0009 a jeho důsledek: aplikace neběží v Node bez bundle kroku (dev `tsx`, produkce esbuild/tsup).

## Alternatives considered

- Cesty od kořene repa (`packages/kernel/src/db`) přes `paths: { "*": ["./*"] }` – čitelnější u hlubokých importů, ale je to zase mapování, které musí znát tsconfig, Vitest, Next.js i bundler.
- Ponechat `@domovnik/*` (stav podle 0009) – standardní monorepo přístup, ale cesta v importu neodpovídá umístění souboru.
