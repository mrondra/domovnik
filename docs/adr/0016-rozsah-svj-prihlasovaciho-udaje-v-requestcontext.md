# 0016 – Rozsah SVJ přihlašovacího údaje v RequestContext

- Status: Accepted
- Date: 2026-09-16
- Deciders: Ondra

## Context

Zadání kap. 9 říká, že u API tokenu si uživatel volí **rozsah SVJ** (všechna / vybraná) a že token
nikdy nemá víc oprávnění než jeho vlastník. Úkol 007 to má doložit kritériem „MCP klient s tokenem
vidí `svj.list` a vrátí jen SVJ v rozsahu tokenu".

Dnes se ale `svjScope` z `api_token` dostane jen do aplikační vrstvy – `apps/api/src/http/state.ts`
(`Principal`) a `apps/mcp/src/server/principal.ts`. `RequestContext`, který jediný putuje do service
a do handlerů toolů (`executeTool(ctx, name, input)`), o rozsahu neví nic. Důsledek:

- `SvjAccessGuard` zúžení uplatní, ale jen na endpointech, které SVJ adresují hlavičkou `x-svj-id`.
- Jakýkoli **seznam napříč SVJ** (`GET /svj`, tool `svj.list`) rozsah tokenu ignoruje: token omezený
  na SVJ A vrátí i B a C.
- Tool nemá rozsah jak zjistit – a přes MCP je tool jediná cesta k datům.

Zúžit až v `apps/mcp` nad výsledkem toolu nejde: byznys logika v appce je proti AGENTS.md §2, řešilo
by to jeden tool a REST by zůstal děravý.

## Decision

`RequestContext` nese rozsah SVJ přihlašovacího údaje:

```ts
readonly svjScope?: readonly SvjId[] | undefined; // undefined = údaj nezužuje, platí celý tenant
```

- Plní ho ten, kdo přihlašovací údaj ověřil: `apps/api/src/http/principal.ts` a
  `apps/mcp/src/server/principal.ts`. Session a podepsaný odkaz nechávají `undefined`.
- Kernel k němu dává jednu funkci `reachableSvj(ctx)` vedle `accessibleSvj`: vrátí průnik toho, co
  smí **aktér** (role, `user_role.svj_id`), a toho, co smí **údaj** (`ctx.svjScope`). `null` znamená
  „všechna SVJ tenanta".
- Feature, která vrací data napříč SVJ, se ptá `reachableSvj(ctx)`. Nesmí se ptát `accessibleSvj`
  přímo – to je jen polovina odpovědi.

## Consequences

- Zúžení je od teď na jednom místě a platí stejně pro REST, MCP i agenty – všechny tři jdou přes
  `ctx`.
- `RequestContext` je odvozovaný, ne mutovatelný; `svjScope` se nastavuje při `createContext` a nikde
  jinde. Rozšířit rozsah tedy nejde jinak než novým přihlašovacím údajem.
- `SvjAccessGuard` zatím dál čte `Principal.svjScope`. Je to stejný údaj ze stejného zdroje, jen o
  vrstvu výš; jeho převedení na `reachableSvj` je úklid, ne oprava, a patří do samostatné změny.
- `Principal.svjScope` zůstává, protože ho potřebuje i výpis tokenů v UI.
- Agentní runtime kontext `svjScope` nenastavuje. Agent běží ve `scope` své definice, to je jiná
  osa omezení; kdyby se ukázalo, že se mají skládat, je to na další ADR.

## Alternatives considered

**Nechat kernel být a zúžit jen podle rolí** – nulová změna, ale kritérium úkolu 007 zůstane
nesplněné a zadání kap. 9 („rozsah SVJ") by platilo jen pro endpointy adresující jedno SVJ.

**Filtrovat výsledek v `apps/mcp`** – nejrychlejší, ale byznys logika v appce (AGENTS.md §2), funguje
jen pro tenhle jeden tool a nechává REST nezúžený.

**Předávat rozsah zvlášť jako argument service metod** – nevyžaduje změnu kernelu, ale každá metoda
by musela mít druhý „bezpečnostní" parametr, který jde zapomenout. `ctx` je právě to místo, kde už
tenant a aktér jsou, a kde se na ně nezapomíná.
