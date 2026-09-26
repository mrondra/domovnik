# 030 – suppliers: obory, pokrytí smluv, tooly, API, seed revizních firem

## Navazuje na

- 029 (`suppliers` feature, `supplier`, `contract`).

## Cíl

Dodavatel má obory (co umí), smlouva říká, které obory pro SVJ pokrývá. Tím `inspections` (037) umí kódem zjistit „má SVJ na revizi elektro smluvní firmu?".

## Rozhraní

Konstanta oborů `packages/features/suppliers/domain/specializations.ts` (zod enum + české popisky v `ui/labels.ts`):
`revize_elektro`, `revize_hromosvod`, `revize_plyn`, `vytahy`, `hasici_pristroje`, `kominy`, `uklid`, `instalater`, `elektrikar`, `strechy`, `zednik`, `pojisteni`, `energie`, `ostatni`.

Migrace (aditivní):

- `supplier`: `specializations text[] NOT NULL DEFAULT '{}'`, `phone text NULL`, `contact_person text NULL`, `is_active boolean NOT NULL DEFAULT true`.
- `contract`: `covers text[] NOT NULL DEFAULT '{}'` (obory ze seznamu).

Service:

```ts
searchSuppliers(ctx, { specialization?, text?, activeOnly = true, limit = 10 }): Promise<Supplier[]>
contractedSupplierFor(ctx, { svjId, specialization, on: Date }): Promise<{ supplier: Supplier; contract: Contract } | null>
  // platná smlouva SVJ, jejíž covers obsahuje obor; více shod → nejnovější valid_from
updateSupplier(ctx, id, patch)   // audit
```

Tooly (readOnly, userComposable, permission `suppliers.read`): `suppliers.search` (`{ specialization?, text? }`), `suppliers.get` (`{ supplierId }` + smlouvy v rozsahu SVJ aktéra), `suppliers.contractFor` (`{ svjId, specialization }`).
Oprávnění (`packages/kernel/src/identity/permissions.ts`): `suppliers.read` → manager (už má? ne – přidej `suppliers.*`), finance (`suppliers.*`), committee, technician; `suppliers.write` jen přes `suppliers.*`.

API: `GET /suppliers?specialization=&q=`, `GET /suppliers/:id`, `PATCH /suppliers/:id` (`suppliers.write`).
Web (`suppliers/ui/`): `SupplierListScreen.tsx` (filtr oboru), `SupplierDetailScreen.tsx` (obory, kontakty, smlouvy per SVJ), navigace „Dodavatelé" (tenant úroveň: manager, finance), stránky `apps/web/src/app/(tenant)/suppliers/…`, `apps/web/src/api/suppliers.ts`.

Seed (`suppliers/seed/`): stávajícím 8 dodavatelům doplň obory; přidej 6 revizních firem: 2× `revize_elektro` (+ `revize_hromosvod` u jedné), 1× `revize_plyn` + `kominy`, 1× `hasici_pristroje`, 1× `vytahy` (druhá výtahová firma pro poptávky), 1× `revize_elektro` jen s telefonem bez e-mailu (poptávka jí nepůjde odeslat – ukáže filtr). Smlouvy: SVJ A má smluvní firmu na `revize_elektro` a `hasici_pristroje`; SVJ B na `vytahy`, `revize_plyn`, `kominy`; SVJ C na `vytahy`. Smyšlená IČO s platným kontrolním součtem, e-maily na `@dodavatel.domovnik.test`.

## Testy

- `contractedSupplierFor`: platná/neplatná smlouva, obor mimo `covers`, dvě smlouvy.
- `searchSuppliers` podle oboru a textu (ILIKE na název).
- Tooly: committee SVJ A vidí u dodavatele jen smlouvy SVJ A.
- RLS beze změny (tabulky existují) – test migrace.

## Akceptační kritéria

`pnpm verify`, `pnpm db:seed` 2× idempotentní, e2e zelené.

## Mimo rozsah

Hodnocení dodavatelů, zakládání smluv z UI.

## Stav po dokončení

`contractedSupplierFor` a `searchSuppliers` k dispozici pro `inspections` a `quotes`.
