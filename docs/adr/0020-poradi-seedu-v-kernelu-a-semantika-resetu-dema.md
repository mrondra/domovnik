# 0020 – Pořadí seedů v kernelu a sémantika resetu dema

- Status: Proposed
- Date: 2026-09-26
- Deciders: Ondra

## Context

Seed skládá data napříč features s vzájemnými závislostmi (`invoices` potřebuje `svj`, `payments`
potřebuje `receivables`/`invoices`) a `orderSeedModules` řadila `SeedModule[]` podle `dependsOn` v
`packages/db`, protože tam žil seed runner (zadání 3.1: `/packages/db` skládá schéma a spouští seed).
Úkol 026 (commit 8953066) potřeboval totéž pořadí i mimo `packages/db`: reset dema (`demo` feature)
musí mazat v obráceném pořadí k sázení a testy potřebují seedovat tenanta bez celého API bootstrapu.
`packages/db` je ale sestavovací balíček (schema composition, migrace), ne runtime závislost, kterou
by si mohla dovolit feature importovat.

## Decision

`orderSeedModules` se přesouvá z `packages/db` do `packages/kernel/src/seed`, kde už žije
`defineSeed`/`registeredSeeds`; `packages/db` ho odtud reexportuje pro zpětnou kompatibilitu volání
z workspace rootu. `SeedModule.dependsOn` (pole jmen modulů) je jediný vstup řazení – topologické
řazení s deterministickým tie-breakem podle jména (viz `order.test.ts`) a chybou na cyklus.
Sémanticky: reset dema **maže jen data, která ukázka vyrobila** (přes `resetHandlers`/`demoReset`
registrované po feature) a seed **znovu nespouští** – po resetu je tenant ve stavu „nasazeno,
nic naklikáno", ne „čerstvě naseedováno", protože feature `demo` nesmí sahat do `packages/db`, kde
seed runner běží (zadání DoD: feature importuje jinou feature jen přes `index.ts`, `packages/db` ani
žádná feature není).

## Consequences

`packages/db` i `demo` reset i testy čtou stejné pořadí ze stejného zdroje – žádná duplicitní logika
topologického řazení. Feature s `dependsOn` na neexistující seed modul selže hlasitě (`order.test.ts`
pokrývá cyklus i chybějící závislost). Úkol 028 (`docs/tasks/028-demo-registry.md`) mění **mechanismus
registrace** resetů (feature si registruje reset sama přes `defineDemoReset` místo pevného seznamu
`HANDLERS` v `demo`), ne tuhle sémantiku – řazení podle `orderSeedModules` a „reset nesází znovu"
platí beze změny i po 028.

## Alternatives considered

Nechat `orderSeedModules` v `packages/db` a nechat `demo` volat `packages/db` přímo – zamítnuto,
porušuje pravidlo dvojích dveří mezi balíčky a `packages/db` by se muselo stát závislostí runtime
kódu, což je sestavovací balíček. Reset, který po smazání dat rovnou znovu seeduje – zamítnuto,
demo scénáře typicky navazují na konkrétní stav (např. faktura čekající na schválení) a automatický
seed by ho přepsal dřív, než by ho prezentující stihl znovu vyvolat tlačítkem.

Commit: 8953066 (úkol 026).
