# 007 – feature `svj` (vzorová feature)

Reference: zadání kap. 4 (SVJ a nemovitost), 10 (demo data); engineering.md §11.

## Cíl

První feature end-to-end přes všechny vrstvy. Bude sloužit jako vzor; pokud se při ní ukáže, že konvence nebo generátor nefungují, **oprav generátor/konvenci (a napiš to do reportu)**, ne jen feature.

## Rozsah

1. `pnpm gen:feature svj`, pak: schema `svj` (název, IČO, adresa, výbor = user ids, bankovní účty jako JSON pro demo), `building`, `unit` (číslo, typ byt/nebyt/garáž, podíl čitatel/jmenovatel, plocha), `department` (patří tenantu, ne SVJ – ok v této feature, je to organizace správcovské firmy: údržba, finance, úklid, technici, správa).
2. Service: CRUD SVJ/budov/jednotek, `getById`, `listForActor` (dle rolí a členství ve výboru), `getShareOfUnit`. Eventy: `svj.svj.created`, `svj.unit.updated`.
3. Tooly (read, `userComposable`): `svj.get`, `svj.list`, `svj.listUnits`. Žádný agent v této feature.
4. API: `/svj`, `/svj/:id`, `/svj/:id/units`, `/departments`.
5. UI: přehled SVJ (karty, cross-SVJ), detail SVJ (základní údaje, jednotky tabulka), navigace registrována.
6. Seed: 3 SVJ ze zadání kap. 10 (A 12 jednotek, B 80, C 40) s reálně vypadajícími, anonymizovanými názvy ulic v Praze, oddělení správcovské firmy.
7. `index.ts` exportuje jen: `SvjService` rozhraní, typy `Svj`, `Unit`, eventy, `navigation`, `readModels.svjSummary`.
8. Testy: unit service, integrační RLS na všech tabulkách, e2e API, contract nic (žádný adapter).

## Akceptační kritéria

- `pnpm db:seed` naplní 3 SVJ; UI je zobrazí; uživatel s rolí `committee` SVJ A nevidí B.
- MCP klient s tokenem vidí `svj.list` a vrátí jen SVJ v rozsahu tokenu.
- Coverage feature ≥ 80 %, `pnpm verify` zelený.
- Report: seznam změn v generátorech/konvencích, které si feature vynutila.
