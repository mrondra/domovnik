# 0017 – Feature má dvoje veřejné dveře: index.ts a ui/index.ts

- Status: Accepted
- Date: 2026-09-16
- Deciders: Ondra

## Context

ADR 0002 a AGENTS.md §2 říkají, že feature je zvenku vidět jen přes `index.ts`. Úkol 006 §4 k tomu
přidal, že stránky v `apps/web` jsou jednořádkové re-exporty z feature, a úkol 004 §4, že `apps/api`
si z feature bere Nest modul. Obojí tedy mířilo do stejného souboru.

První feature (`svj`, úkol 007) ukázala, že to nejde. Jeden barrel drží zároveň:

- `SvjModule` – dekorovaná Nest třída, která táhne `@nestjs/common` a `@nestjs/swagger`,
- `SvjOverviewScreen` – React server komponentu v `.tsx`.

Obojím směrem to selhává na buildu, ne na vkusu:

- `next build` skončí `Module not found: Can't resolve '@nestjs/microservices/microservices-module.js'`
  – webpack jde přes `apps/web/src/api/svj.ts` → `features/svj/index.ts` → `api/svj.module.ts` →
  `@nestjs/swagger` → `@nestjs/core`. Nest třída má side effecty, takže ji tree shaking neodstraní.
- `apps/api` (tsc i Vitest) naopak musí umět přeložit `.tsx`, které přes stejný barrel přijde.
  Šlo to obejít (`jsx` v `apps/api/tsconfig.json`, transformace ve Vitestu), ale znamenalo by to
  React v serverovém bundlu.

## Decision

Feature má **dva** veřejné vstupy a žádný další:

| Soubor        | Pro koho                                   | Co vystavuje                                                               |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `index.ts`    | `apps/api`, workers, mcp, ostatní features | Nest modul, service rozhraní, doménové typy, eventy, `readModels`          |
| `ui/index.ts` | `apps/web`                                 | screeny, `navigation`, zod schémata a view typy pro parsování odpovědí API |

Obojí jsou barrely podle stávajícího pravidla (`domovnik/index-is-barrel`) a obojí má `README.md`.
Cokoli jiného uvnitř feature zůstává soukromé.

Vynuceno stejně jako dosud, jen se seznamem dvou cest: `eslint-plugin-boundaries`
(`FEATURE_PUBLIC`) a `dependency-cruiser` (`feature-via-index-only`, `apps-no-feature-internals`).

## Consequences

- `apps/web` importuje `packages/features/<name>/ui/index`, `apps/api` `packages/features/<name>`.
  `compose-navigation` generuje import z `ui/index`, `compose-features` z kořenového `index.ts`.
- Serverový bundle nikdy neobsahuje React, klientský nikdy Nest. `apps/api/tsconfig.json` nepotřebuje
  `jsx` a Vitest nepotřebuje nastavovat JSX transformaci.
- Zod schémata, kterými `apps/web` parsuje odpovědi, vystavuje `ui/index.ts`. Je to kontrakt, který
  UI vykresluje, a drží se tak na jednom místě s obrazovkami, které ho čtou.
- `packages/shared` a feature mají v `tsconfig.json` `jsx: "react-jsx"` místo `"preserve"`. Next si
  čte `tsconfig.json` z `apps/web`, takže na jeho build to nemá vliv; Vitest ale `preserve` přeložit
  neumí a navigační unit test `apps/web` skrz `ui/index.ts` `.tsx` importuje.
- Feature bez UI má jen `index.ts`. Druhé dveře nejsou povinné.

## Alternatives considered

**Nechat jeden barrel a UI z něj nevystavovat, stránky si data i komponenty skládat v `apps/web`** –
zachová jedny dveře, ale popírá 006 §4 a vrací per-feature UI kód do appky.

**Nechat jeden barrel a spolehnout se na tree shaking** – ověřeno, že nefunguje: dekorovaná Nest
třída je side effect a webpack ji v grafu nechá.

**Vystavit UI přes `exports` v `package.json` feature** – tvarem totéž, ale importy jdou relativními
cestami bez aliasů (ADR 0010), takže `exports` se v repu stejně nepoužívají.
