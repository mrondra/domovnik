# 056 – demo: seed a výpis z banky nesmí záležet na dnešním datu

## Proč

Vada nalezená CI, ne plánovaný rozsah. **Není v ní nic rozbitého v kódu
jedné větve** — je to závislost dema na dni, kdy se testy spustí.

Důkaz, tentýž commit `ad0c213` na `main`:

| kdy               | `pnpm verify`                                                   |
| ----------------- | --------------------------------------------------------------- |
| 2026-09-30 ~21:0x | **zelený** · 146/146 souborů, 794 testů                         |
| 2026-10-01 07:33  | **padá** na `packages/features/demo/tests/reset.int.test.ts:66` |

```
AssertionError: expected 80 to be less than 80
  expect((await listDebtors(ctx, { svjId, minDebt: 1 })).length).toBeLessThan(debtorsBefore)
```

Padá i `apps/web/e2e/phase1.e2e.ts:128` (timeout na „Porovnání našlo N nový
rozdíl" po scénáři `pohoda-mutation`) — na `main` i na větvi, dnes stejně.
Obojí ověřeno ručně mimo sandbox, ne odvozeno z CI.

## Co to dělá

Dvě místa čtou „dnes" nezávisle na sobě:

- `packages/features/receivables/seed/receivables.seed.ts:18` — seeduje předpisy
  pro `monthsUpTo(new Date())`, tedy **včetně běžícího měsíce**
- `packages/features/payments/demo/bank-sync.ts:19-21` — `rangeOf(months, today = new Date())`
  dává výpisu z banky `to: asDay(today)`, tedy **dnešek**

Platba za předpis běžícího měsíce (`generator.ts:29`: `bookedOn = prescription.dueDate`)
leží mimo rozsah výpisu, takže se nespáruje a dluh zůstane všem jednotkám.
Prvního dne měsíce to vyjde na všech 80 → `toBeLessThan(80)` padá.

**Mechanismus si ověř sám**, tohle je moje čtení kódu, ne měření. Ber ho jako
hypotézu, kterou máš potvrdit nebo vyvrátit — pokud je příčina jiná, řekni to
a oprav tu skutečnou.

## Cíl

Demo a jeho testy nesmí dávat jiný výsledek podle dne, kdy se spustí. „Dnes"
smí vstupovat do dema **z jednoho explicitního místa**, ne z `new Date()`
rozesetého po seedech a adaptérech.

## Rozsah

- `packages/features/receivables/seed/`, `packages/features/payments/demo/`
  a cokoli dalšího, co si na tomtéž řetězci bere `new Date()`
- test, který tu hranici měsíce pokrývá explicitním datem
- `packages/features/demo/tests/reset.int.test.ts` smíš upravit **jen** pokud
  je vadný sám; když je vadný seed, test nech být a oprav seed

## Mimo rozsah

- jakákoli změna chování dema viditelná uživatelem (jiná data v ukázce)
- oprava `phase1.e2e.ts` úpravou testu; jde-li o tutéž příčinu, spraví ji oprava
  seedu, a pokud ne, zapiš to a zastav se

## Akceptační kritéria

`pnpm verify` dnes (tj. v den, kdy padá) a žádné `new Date()` v cestě
seed → výpis z banky. e2e ověří CI.

Navíc, a tohle **nehlídá gate, ale reviewer**: musí vzniknout test, který
hranici měsíce pokrývá **explicitním datem**. Bez něj je oprava neověřená —
projde dnes a nikdo nepozná, až se to vrátí. Napsat to jako příkaz se mi
nepovedlo, aniž bych buď předepsal jméno souboru, nebo napsal grep tak volný,
že projde i před opravou; proto je to požadavek v textu.

## Stav po dokončení

`pnpm verify` dává stejný výsledek 1., 15. i poslední den měsíce.
