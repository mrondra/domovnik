# 028 – demo: scénáře a reset konvencí (obrácení závislostí)

Reference: ADR 0002 (nová feature = nová složka), ADR z 027 bod 3; `packages/features/demo/service/run.ts` (`RUNNERS`), `service/reset.ts` (`HANDLERS`), `domain/types.ts` (`scenarioKindSchema`).

## Navazuje na

- `demo` dnes importuje `invoices`, `payments`, `accounting-sync`, `documents`, `receivables` (runnery a reset) a tytéž features importují `demo` (`registerScenario` v seedu). Každá nová feature by musela sahat do `demo`.

## Cíl

`demo` zná jen registr. Feature přidá druh scénáře a svůj reset souborem v `packages/features/<f>/demo/`. Chování dema se nemění.

## Vytvoří / upraví

- `packages/features/demo/domain/definition.ts`:
  ```ts
  export interface ScenarioKindDefinition<P extends z.ZodType> {
    readonly kind: string; // 'inbound_invoice'
    readonly feature: string; // 'invoices'
    readonly payload: P;
    readonly run: (ctx: RequestContext, code: string, payload: z.output<P>) => Promise<ScenarioResult>;
  }
  export const defineScenarioKind: <P extends z.ZodType>(
    d: ScenarioKindDefinition<P>,
  ) => ScenarioKindDefinition<P>;
  export interface DemoResetDefinition {
    readonly feature: string;
    readonly run: (ctx: RequestContext) => Promise<number>;
  }
  export const defineDemoReset: (d: DemoResetDefinition) => DemoResetDefinition;
  ```
  Registr in-memory stejně jako `defineTool` (registrace = definice). Duplicitní `kind` → `DomainError('demo_kind_duplicate')`.
- `packages/features/demo/service/discovery.ts` – `loadDemoModules()` naimportuje `packages/features/*/demo/*.ts` (stejný mechanismus jako `loadToolsFrom`); volá ho `DemoService` v `onModuleInit` a `resetDemo`/`runScenario` před prvním použitím (idempotentně). `apps/*` se nemění.
- `run.ts`: `RUNNERS` zmizí; `runScenario` najde definici podle `kind` z DB, parsuje `payload` jejím schématem. Neznámý kind → `NotFoundError('demo_kind_unknown')`.
- `reset.ts`: `HANDLERS` zmizí; pořadí = **obrácené pořadí seedů** (`orderSeedModules` z kernelu nad `feature` jmény registrovaných resetů; feature bez seedu jde na konec). `forgetDecisions` zůstává v `demo`.
- `domain/types.ts`: `scenarioKindSchema` → `z.string().min(1)`; `ScenarioResult.outcome` rozšiř na `z.string().min(1)` a přidej `link: { label: string; path: string } | null` místo `invoiceId` (UI ukáže odkaz na cokoli, co scénář vyrobil). `ui/wire.ts` + `ScenarioCard.client.tsx` upravit.
- Přesuny (obsah beze změny chování):
  - `demo/service/run.ts` `deliverInvoice` → `packages/features/invoices/demo/inbound-invoice.ts`
  - `demo/service/bank-sync.ts` → `packages/features/payments/demo/bank-sync.ts`
  - `demo/service/pohoda-mutation.ts` → `packages/features/accounting-sync/demo/pohoda-mutation.ts`
  - každé `demoReset` z `service/index.ts` features → `packages/features/<f>/demo/reset.ts` s `defineDemoReset`; export `resetX` z `index.ts` features odstraň.
- Nový druh v `demo` samotném: `packages/features/demo/demo/daily-tick.ts` – kind `daily_tick`, payload `{}`, emituje `tick.daily` pro tenant s `at` = začátek dnešního dne (spustí všechna denní hlídání; využijí 038, 052). Seed `demo` zaregistruje scénář `daily-tick` („Spustit ranní kontrolu termínů").
- `tooling/generators/generate/feature.ts` – kostra feature obsahuje `demo/reset.ts` se šablonou `defineDemoReset` (vrací 0) a `README.md` ve `demo/`.
- `knip.json` – entry `packages/features/*/demo/*.ts`.
- `.dependency-cruiser.cjs` – nové pravidlo `demo-knows-no-feature`: `packages/features/demo/**` nesmí importovat `packages/features/(?!demo)`.

## Testy

- Existující `demo.int.test.ts`, `reset.int.test.ts`, `phase1.e2e.ts` beze změny výsledku (jen úpravy importů).
- Nový test: dočasná feature s `demo/x.ts` (vzor jak testuje discovery `apps/workers`) → scénář s kind `x` jde spustit bez změny `demo`.
- Reset pořadí: registrované resety `accounting-sync`, `payments`, `invoices` se volají v tomto pořadí (obráceně k seedům).
- `daily_tick` → v outboxu je `tick.daily` pro daný tenant.

## Akceptační kritéria

- `git grep "features/(invoices|payments|accounting-sync|documents|receivables)" packages/features/demo` nic nenajde; depcruise pravidlo to hlídá.
- `pnpm verify` a `pnpm test:e2e` zelené.

## Mimo rozsah

Nové scénáře fáze 2 (přidávají je jednotlivé úkoly).

## Stav po dokončení

Scénář = `packages/features/<f>/demo/<kind>.ts` + `registerScenario` v seedu; reset = `demo/reset.ts`. Existuje scénář `daily-tick`.
