# 0024 – suppliers závisí na svj přes read model

- Status: Proposed
- Date: 2026-09-28
- Deciders: Ondra
- Supersedes: 0023

## Context

Review úkolu 029 (`.task/nalezy.md` nález 1, úkol t029r) zjistilo, že `suppliers/seed/suppliers.seed.ts`
importuje `readModels` z `../../svj/index`, aby zjistil pořadí, ve kterém byly demo SVJ založeny
(`svjSummary`, `svjSequence`) — bez toho neví, kterému skutečnému `SvjId` patří která řádka
`seed/data/contracts.ts`. ADR 0023 přitom v `Consequences` tvrdí „`suppliers` nezávisí na žádné
jiné feature“ a `suppliers/README.md` totéž opakovalo. Obojí bylo od začátku nepravdivé — mechanická
kontrola úkolu 029 hlídala jen `grep "features/svj/"`, ne relativní import `'../../svj/index'`, a
tichý rozpor mezi kódem a dokumentací tím prošel.

Stejný vzor — seed feature čte `readModels` ze `svj` (`svjSummary`/`svjSequence`), aby přiřadil
ukázková data správnému domu — má i `receivables/seed`, `payments/seed`, `invoices/seed` a
`accounting-sync/seed`; žádná z nich netvrdí nezávislost na `svj`, takže u nich rozpor nevzniká.
Odstranit závislost by znamenalo, že by orchestrátor seedů (`packages/kernel/src/seed`) musel nosit
seznam domů v `SeedContext` místo toho, aby ho každá feature zjišťovala přes `svj`'s read model — to
je změna kernelového kontraktu nad rámec úkolu t029r (AGENTS §0) a rozbila by stejný, dnes fungující
vzor u čtyř dalších features zároveň.

## Decision

`suppliers` smí záviset na `svj`, a to výhradně přes `svj`'s read model (`readModels.svjSummary`,
`readModels.svjSequence`, engineering §2) a výhradně v `seed/` (a v testech, které si SVJ fixture pro
seed test připravují stejným způsobem). Zbytek — `domain/`, `service/`, `api/`, `index.ts` — zůstává
bez závislosti na jiné feature, přesně jak ADR 0023 zamýšlelo. Hranici teď hlídá `depcruise` pravidlo
`suppliers-knows-no-feature` v `.dependency-cruiser.cjs` (from `packages/features/suppliers/` mimo
`seed/` a testy, to jakákoli jiná feature), ne jen tvrzení v README. Zbytek rozhodnutí ADR 0023 —
přesun tabulek, `BudgetCategory` u `Contract`, umístění API, seed adresáře a smluv — platí beze
změny.

## Consequences

`suppliers/README.md` už netvrdí bezpodmínečnou nezávislost, popisuje přesně tuhle výjimku a
odkazuje na `suppliers-knows-no-feature`. `pnpm depcruise` selže, pokud někdo přidá import jiné
feature mimo `suppliers/seed/`, takže se rozpor mezi kódem a dokumentací nemůže tiše vrátit.
`receivables`, `payments`, `invoices` a `accounting-sync` se nemění — jejich seedy měly stejnou
závislost už předtím a nikdy netvrdily opak.

## Alternatives considered

Přenášet seznam domů (a jejich pořadí) seedovacím orchestrátorem přes `SeedContext`, aby žádná
feature nemusela číst `svj`'s read model — zamítnuto: je to změna kernelového kontraktu, dotkla by se
čtyř dalších features se stejným vzorem a je mimo rozsah t029r, který smí opravit jen nálezy z
review, ne přepisovat architekturu seedů. Nechat `suppliers.seed.ts` bez `dependsOn: ['svj']` a
spoléhat na to, že `svj` seed už proběhl dřív — zamítnuto, `dependsOn` je jediný mechanismus, kterým
`packages/kernel/src/seed/order.ts` pořadí seedů vůbec zaručuje (ADR 0020); bez něj by pořadí bylo
náhodné.
