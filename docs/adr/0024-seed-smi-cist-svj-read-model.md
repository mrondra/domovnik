# 0024 – seed smí číst svj's read model, aby věděl, do kterého domu seeduje

- Status: Accepted
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

Ověřeno v kódu (`git grep "from '\.\./\.\./svj/index'" -- 'packages/features/*/seed'`), stejný vzor má
**každý** seed, který zakládá data pro víc než jeden dům, ne jen `suppliers`:

| seed                                            | co ze `svj/index` importuje | k čemu                                                                                                            |
| ----------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `suppliers/seed/suppliers.seed.ts`              | `readModels`                | `readModels.svjSummary`/`svjSequence` — pořadí domů pro `seed/data/contracts.ts`                                  |
| `invoices/seed/invoices.seed.ts`                | `readModels`                | totéž, pro `seedBudget`/scénáře faktur                                                                            |
| `receivables/seed/receivables.seed.ts`          | `readModels`                | `readModels.svjSummary` — pro který dům generovat předpisy                                                        |
| `payments/seed/bank-accounts.seed.ts`           | `SvjService`, `readModels`  | `readModels.svjSummary` pro výčet domů, `svj.getById(...).bankAccounts[0]` pro účet, na který se importují výpisy |
| `accounting-sync/seed/accounting-links.seed.ts` | `SvjService`, `readModels`  | `readModels.svjSummary` pro výčet domů, `svj.getById(...).ico` pro napojení na Pohodu                             |

Žádná z těchto čtyř dalších features (`invoices`, `receivables`, `payments`, `accounting-sync`)
netvrdí ve svém README nezávislost na `svj` — u nich tedy rozpor kód/dokumentace nikdy nevznikl.
Rozpor vznikl jen u `suppliers`, protože jediné z pěti tvrdilo „depends on no other feature“ a
zároveň mělo stejnou seedovou závislost jako ostatní čtyři.

Odstranit tuhle závislost úplně — aby žádný seed nemusel `svj`'s read model číst — by znamenalo, že
by orchestrátor seedů (`packages/kernel/src/seed`) musel nosit seznam domů v `SeedContext` místo
toho, aby si ho každá feature zjišťovala sama. To je změna kernelového kontraktu nad rámec úkolu
t029r (AGENTS §0) a dotkla by se všech pěti features najednou, ne jen `suppliers`.

## Decision

Seed jakékoli feature smí importovat `svj/index` (`readModels`, případně `SvjService`), protože
potřebuje vědět, do kterého domu zakládá demo data — to není únik implementačního detailu, je to
vstupní parametr seedu. Tahle výjimka platí výhradně pro `seed/` (a testy, které si SVJ fixture pro
seed test připravují stejným způsobem); zbytek feature — `domain/`, `service/`, `api/`, `index.ts` —
se řídí obvyklou hranicí (ADR 0017: feature importuje jinou feature jen přes její `index.ts`, a jen
pokud to skutečně potřebuje).

Pro `suppliers` konkrétně to znamená, že „nezávisí na žádné feature“ z ADR 0023 platí mimo `seed/`;
hranici teď hlídá `depcruise` pravidlo `suppliers-knows-no-feature` v `.dependency-cruiser.cjs`
(`from` = `packages/features/suppliers/` mimo `seed/` a testy, `to` = jakákoli jiná feature), ne jen
tvrzení v README. `receivables`, `payments`, `invoices` a `accounting-sync` nemají analogické
depcruise pravidlo, protože žádná z nich netvrdí bezpodmínečnou nezávislost — nemají tedy co
vynucovat. Zbytek rozhodnutí ADR 0023 — přesun tabulek, `BudgetCategory` u `Contract`, umístění API,
seed adresáře a smluv — platí beze změny.

## Consequences

`suppliers/README.md` už netvrdí bezpodmínečnou nezávislost, popisuje přesně tuhle výjimku a
odkazuje na `suppliers-knows-no-feature`. `pnpm depcruise` selže, pokud někdo přidá do `suppliers`
import jiné feature mimo `suppliers/seed/`, takže se rozpor mezi kódem a dokumentací nemůže tiše
vrátit. `receivables`, `payments`, `invoices` a `accounting-sync` se nemění — jejich seedy měly
stejnou závislost už předtím a nikdy netvrdily opak, takže pro ně tohle ADR jen pojmenovává existující
a dál platný vzor, nepřidává jim žádnou novou vynucovanou hranici.

## Alternatives considered

Přenášet seznam domů (a jejich pořadí) seedovacím orchestrátorem přes `SeedContext`, aby žádný seed
nemusel číst `svj`'s read model přímo — zamítnuto: je to změna kernelového kontraktu, dotkla by se
všech pěti features se stejným vzorem najednou a je mimo rozsah t029r, který smí opravit jen nálezy
z review, ne přepisovat architekturu seedů.

Vynutit `depcruise` pravidlo analogické `suppliers-knows-no-feature` i pro `receivables`, `payments`,
`invoices` a `accounting-sync` — zamítnuto pro t029r: žádná z nich netvrdí nezávislost, takže by šlo
o nové architektonické rozhodnutí (co všechno tyhle čtyři features smí importovat) nad rámec nálezu
1, ne o opravu rozporu kód/dokumentace. Kandidát na samostatné budoucí ADR, pokud se ukáže potřeba.

Nechat `suppliers.seed.ts` bez `dependsOn: ['svj']` a spoléhat na to, že `svj` seed už proběhl dřív —
zamítnuto, `dependsOn` je jediný mechanismus, kterým `packages/kernel/src/seed/order.ts` pořadí seedů
vůbec zaručuje (ADR 0020); bez něj by pořadí bylo náhodné.
