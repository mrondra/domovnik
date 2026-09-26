# 029 – suppliers: přesun `supplier` a `contract` z invoices (čistý refaktor)

Reference: ADR 0002; `packages/features/invoices/schema/suppliers.ts`, `service/suppliers.ts`, `service/contracts.ts`.

## Navazuje na

- `supplier` (`tenantTable`) a `contract` (`svjTable`) žijí v `invoices`. Ve fázi 2 je potřebují `inspections` a `quotes`; nechat je v `invoices` by znamenalo, že poptávky závisí na fakturách.

## Cíl

Nová feature `suppliers` vlastní tabulky `supplier` a `contract` a jejich service. **Žádná změna chování ani dat.** `invoices` importuje z `packages/features/suppliers/index`.

## Vytvoří / upraví

- Nové ADR (Accepted – schváleno tímto zadáním): „Dodavatelé a smlouvy jako samostatná feature `suppliers`". Context: potřeba z `inspections`/`quotes`; Decision: přesun bez přejmenování tabulek; Consequences: migrace prázdná, `invoices → suppliers`.
- `pnpm gen:feature suppliers` (scope `suppliers` doplnit do `commitlint.config.js`, pokud generátor nedoplní).
- Přesun: `schema/suppliers.ts` → `packages/features/suppliers/schema.ts` (názvy tabulek, sloupců, indexů beze změny); `service/suppliers.ts`, `service/contracts.ts` → `suppliers/service/`; typy `Supplier`, `Contract` a jejich id/zod schémata → `suppliers/domain/`; seed dodavatelů a smluv z `invoices/seed/` → `suppliers/seed/suppliers.seed.ts` (`dependsOn: ['svj']`); `invoices` seed dostane `dependsOn: ['suppliers', …]`.
- `suppliers/index.ts`: `SuppliersModule`, `SuppliersService`, `createSupplier`, `findSupplierByIco`, `supplierById`, `listSuppliers`, `createContract`, `findContractsForSupplier`, typy `Supplier`, `Contract`, `SupplierId`, `ContractId` + zod schémata id.
- `invoices/index.ts`: přestane exportovat `findContractsForSupplier`, `findSupplierByIco`, `supplierById`, `Supplier`, `Contract`. Všechna místa (včetně `accounting-sync` a testů) importují z `suppliers`.
- API endpointy `GET /suppliers`, `GET /svj/:svjId/contracts` přesuň do `suppliers/api/` – URL beze změny.
- Tool `invoice.supplierHistory` zůstává v `invoices` (je o fakturách).
- `pnpm db:generate` – **ověř, že migrace je prázdná** (jen přesun definice); pokud Drizzle Kit hlásí změnu, zastav se.

## Testy

- Všechny existující testy invoices/accounting-sync/payments projdou beze změny asercí.
- Přesunuté testy (RLS supplier/contract, service) žijí v `suppliers/tests/`.
- `pnpm test:e2e` zelený.

## Akceptační kritéria

- `git grep "supplier" packages/features/invoices/schema` nic; `pnpm db:generate` nevytvoří migraci.
- Depcruise: `suppliers` nezávisí na žádné feature.

## Mimo rozsah

Nové sloupce, tooly, seed revizních firem (030).

## Stav po dokončení

Feature `suppliers` s původními daty a API; `invoices → suppliers`.
