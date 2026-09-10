# 0009 – Importy bez přípony (`module: Preserve`)

- Status: Superseded by 0010
- Date: 2026-09-10
- Deciders: Ondra

## Context

Bootstrap (úkol 000, commit `fe3d2fa`) nastavil v `tsconfig.base.json` `module: NodeNext` + `moduleResolution: NodeNext`. V kombinaci s `"type": "module"` to znamená, že relativní import musí nést příponu `.js`, i když cílový soubor je `.ts` (`import { extract } from './invoice.js'`). Specifikátor pak neodpovídá souboru, který v repu skutečně existuje. Rozhodnutí padlo při revizi bootstrap commitu: importy se píší bez přípony.

## Decision

`tsconfig.base.json` používá `"module": "Preserve"` (implikuje `moduleResolution: Bundler`, `esModuleInterop` a `allowSyntheticDefaultImports`). Relativní importy se píší bez přípony (`import { x } from './x'`), cross-package přes aliasy `@domovnik/*`.

## Consequences

- Node neumí spustit bezpříponové ESM. Aplikace (úkoly 004–006) proto běží přes transpiler/bundler: `apps/web` si bundluje Next.js sám, `apps/api` a `apps/workers` v devu přes `tsx`, pro produkci přes bundle (esbuild/tsup). Ověřit v 004 a 005.
- Není to nová třída problémů: `packages/*` exportují přímo `./src/index.ts`, takže konzument musel TypeScript zpracovávat i před tímto rozhodnutím.
- ESLint hranice potřebují `eslint-import-resolver-typescript` (zapojen v `tooling/eslint/eslint.config.js`); bez něj se importy nerozřeší a `boundaries/*` tiše propustí všechno. `dependency-cruiser` resolvuje přes `tsConfig` a bezpříponové importy zvládá.
- Vitest (Vite) resolvuje relativní importy bez přípony sám; aliasy `@domovnik/*` je potřeba zpřístupnit přes workspace závislosti v `package.json` daného package, případně `vite-tsconfig-paths`. Vyřeší se v 001/003 při prvním skutečném cross-package importu.
- Vylučujeme spouštění nezabundlovaného ESM přímo v Node (`node dist/main.js` bez bundle kroku).

## Alternatives considered

- Zůstat u `NodeNext` s `.js` specifikátory – aplikace by šly spustit v Node bez bundleru, ale specifikátor neodpovídá reálnému souboru.
- `module: ESNext` + `moduleResolution: Bundler` – stejný výsledek pro importy, ale bez implicitního `esModuleInterop`, který CJS ekosystém kolem NestJS potřebuje.
