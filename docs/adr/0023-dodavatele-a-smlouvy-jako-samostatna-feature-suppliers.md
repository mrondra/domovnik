# 0023 – Dodavatelé a smlouvy jako samostatná feature suppliers

- Status: Superseded by 0024
- Date: 2026-09-27
- Deciders: Ondra

## Context

`supplier` (tenantTable) a `contract` (svjTable) žily ve `packages/features/invoices` (ADR 0002),
protože ve fázi 1 je potřebovaly jen faktury. Úkol 029 (`docs/tasks/029-suppliers-extract.md`)
připravuje fázi 2: `inspections` a `quotes` potřebují stejný adresář dodavatelů a stejné smlouvy,
aniž by závisely na fakturách – poptávka na revizní firmu nemá důvod táhnout za sebou celou
doménu faktur.

## Decision

`supplier` a `contract`, jejich domain typy/id/zod schémata a service (`createSupplier`,
`findSupplierByIco`, `supplierById`, `listSuppliers`, `createContract`, `findContractsForSupplier`,
`contractById`, `listContracts`) se přesouvají beze změny názvů tabulek, sloupců ani chování do
nové feature `packages/features/suppliers`. `invoices` na ni odkazuje výhradně přes
`suppliers/index`. `BudgetCategory` (typ i zod schéma) jde s `Contract` do `suppliers`, protože je
to atribut smlouvy a `invoices` už na `suppliers` směr závislosti má – `invoices/index` ho dál
reexportuje, takže konzumenti uvnitř `invoices` (rozpočet, kontroly, UI) nic nemění. Tool
`invoice.supplierHistory` zůstává v `invoices`, protože je o fakturách dodavatele, ne o něm samém.
API `GET /suppliers` a `GET /svj/:svjId/contracts` se stěhuje do `suppliers/api` beze změny URL.
Seed adresáře a smluv (`suppliers.seed.ts`, `dependsOn: ['svj']`) jde do `suppliers/seed`; seed
`invoices` na něj získává závislost (`dependsOn: ['suppliers', 'svj']`) a přestává dodavatele i
smlouvy sázet sám – ukázkové scénáře, které potřebují jméno/IČO/účet odesílatele pro vygenerování
PDF, si drží vlastní malou tabulku (stejný vzor duplicity jako `service/reach.ts` má každá feature
svůj).

## Consequences

Migrace je prázdná (`pnpm db:generate` nehlásí žádnou změnu) – jde jen o přesun definice mezi
balíčky, ne o změnu schématu. `suppliers` nezávisí na žádné jiné feature (ověřuje `depcruise` a
grep v akceptačních kritériích úkolu). Testy RLS pro `supplier`/`contract` a service testy
(`createSupplier`, `findContractsForSupplier`, …) žijí v `suppliers/tests`; `invoices/tests` dál
pokrývá jen to, co je skutečně o fakturách (rozpočet, extrakce, schvalování).

## Alternatives considered

`BudgetCategory` nechat v `invoices` a v `suppliers/domain/types.ts` typovat `Contract.budgetCategory`
jako `string` – zamítnuto, ztratila by se typová kontrola na zápisu smlouvy a čtení by muselo všude
přetypovávat; `suppliers` tím nezíská závislost na `invoices`, protože typ jde směrem
`invoices → suppliers`, ne obráceně. Nechat dodavatele v `invoices` a nechat `inspections`/`quotes`
číst jejich tabulky přes zvláštní read-model – zamítnuto zadáním úkolu 029, které přesun žádá přímo.
