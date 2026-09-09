# 0002 – Feature-based monorepo (vertical slices)

- Status: Accepted
- Date: 2026-09-09

## Context

Projekt bude mít ~24 features a mnoho agentů. Vrstvená architektura (controllers/services/repositories napříč doménou) při tomto počtu vede k rozptýlení jedné feature po celém repu.

## Decision

`packages/features/<name>` drží vše k feature: schema, domain, service, tools, agents, api, ui, adapters, seed, tests. `packages/kernel` je jediná horizontální vrstva. `apps/*` jsou jen bootstrap. Hranice vynucuje `eslint-plugin-boundaries` a `dependency-cruiser`; registrace do aplikací je automatická podle konvence.

## Consequences

UI komponenty žijí v packages → Next.js `transpilePackages`, konvence `*.client.tsx`. Cross-feature vazba primárně přes eventy; přímý import jen přes `index.ts`. Cykly = chyba buildu.

## Alternatives considered

Vrstvy per app – zavrženo (rozptýlení). UI v `apps/web/features` – zavrženo (feature rozťatá na dvě místa).
