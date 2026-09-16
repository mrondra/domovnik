# Engineering guidelines – Domovník

Doplněk k `AGENTS.md`. Co jde vynutit nástrojem, je vynuceno (viz `tooling/`); tento dokument
popisuje zbytek a vysvětluje proč.

## 1. Tooling

| Věc           | Nástroj                                                                                           | Poznámka                          |
| ------------- | ------------------------------------------------------------------------------------------------- | --------------------------------- |
| Workspace     | pnpm workspaces + Turborepo                                                                       | `verify` per package, cache       |
| Jazyk         | TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride` | `tsconfig.base.json`              |
| Lint          | ESLint (typescript-eslint strict, boundaries, custom rules)                                       | `tooling/eslint`                  |
| Formát        | Prettier                                                                                          | žádné formátovací ESLint pravidla |
| Závislosti    | dependency-cruiser (cykly, vrstvy), knip (mrtvý kód)                                              | oba v `verify`                    |
| Testy         | Vitest, testcontainers (Postgres), msw (HTTP adaptery)                                            |                                   |
| Git           | conventional commits, lefthook (lint-staged, gitleaks, commitlint)                                |                                   |
| CI            | GitHub Actions – `pnpm verify` + build                                                            | stejné jako lokálně               |
| Logy          | pino                                                                                              | strukturované, JSON               |
| Validace      | zod                                                                                               |                                   |
| DB            | Drizzle + Drizzle Kit                                                                             |                                   |
| Agenti        | Anthropic Agent SDK                                                                               |                                   |
| Observabilita | Langfuse                                                                                          |                                   |

## 2. Struktura a hranice

Viz `AGENTS.md` §2. Doplnění:

- **`index.ts` je barrel, ne modul.** Smí obsahovat jen `import` a re-export (`export … from`, `export * from`). Jediná povolená výjimka je složení namespace objektu z už naimportovaných funkcí (`export const events = { emit, subscribe } as const`). Definice – funkce, třídy, schémata, konstanty – patří do pojmenovaného souboru vedle (`errors/taxonomy.ts`, `env/load.ts`, `audit/record.ts`) a `index.ts` je jen vypíše. Důvod: z `index.ts` se má dát přečíst, co adresář nabízí, bez čtení implementace, a diff na veřejném rozhraní se nemíchá s diffem na chování. Vynuceno pravidlem `domovnik/index-is-barrel`.
- **Soubor má strop 100 řádků** (`max-lines`, počítají se jen řádky s kódem). Platí i na testy. Když soubor přeroste, udělej z něj složku s `index.ts` a rozděl obsah podle odpovědnosti, ne podle abecedy nebo velikosti:

  ```
  agents/runtime/        types.ts · tool-bridge.ts · session.ts · outcome.ts · run-agent.ts · index.ts
  identity/service/      tenants.ts · users.ts · authentication.ts · sessions.ts · api-tokens.ts · index.ts
  db/schema/             enums.ts · organisation.ts · access.ts · agents.ts · events.ts · governance.ts · index.ts
  ```

  Barrel se pak importuje jako `./runtime/index`, takže volající o rozdělení neví. Nezvyšuj strop a nepiš `eslint-disable`; když se odpovědnost opravdu nedá rozdělit, je to téma na ADR.

- Sdílená příprava pro testy (definice agenta, mock toolu, seed) žije v `*.fixture.ts` vedle testu. Produkční kód z fixtury importovat nesmí (hlídá `dependency-cruiser`).
- **Každá složka s `index.ts` má `README.md`** (u `src/` ho zastupuje README v kořeni balíčku). Tři části, **anglicky** (README stojí u kódu, platí pro něj stejné pravidlo jako pro komentáře): k čemu složka je; tabulka soubor → odpovědnost; pravidlo, které v ní platí, a proč – tam patří i odkaz na ADR. Píše se pro někoho, kdo do složky přišel poprvé a potřebuje vědět, čeho se v ní držet, ne výčet funkcí, který stejně řekne `index.ts`. Vynuceno pravidlem `domovnik/require-directory-readme`.
- `index.ts` feature exportuje: Nest modul, service rozhraní (jen ty metody, které ostatní potřebují), doménové typy/DTO, názvy eventů se schématy. **Neexportuje** schema tabulek, interní helpery, adaptery.
- Feature s UI má druhé veřejné dveře, `ui/index.ts`: screeny, `navigation` a zod schémata, kterými `apps/web` parsuje odpovědi API. Serverový barrel táhne Nest, který Next build nepřeloží, a naopak (ADR 0017). Feature bez UI druhé dveře nemá.
- Feature nesmí číst tabulky jiné feature přímo přes Drizzle. Jediná výjimka: `packages/db` (migrace, seed) a `features/reports` + `features/copilot`, které mají read-only přístup přes explicitně exportované „read modely" (`index.ts` → `readModels`).
- Cross-feature zápis vždy přes event nebo přes service druhé feature. Nikdy přes DB.
- `shared` obsahuje jen věci bez domény (ui kit, date/money utils, test helpery). Když do `shared` chceš dát něco s názvem z domény, patří to do feature nebo kernelu.

## 3. Pojmenování

- Soubory: `kebab-case.ts`; React komponenty `PascalCase.tsx`; klientské komponenty `*.client.tsx` s `"use client"`.
- Tabulky a sloupce: `snake_case`, singulár (`invoice`, `bank_transaction`). Vždy `tenant_id`, u SVJ-vázaných `svj_id`, `created_at`, `updated_at`; identifikátory `uuid v7`.
- Eventy: `domena.entita.akce` (`finance.invoice.received`), minulý čas pro doménové, přítomný stav pro agentní (`finance.transactions.unmatched`).
- Tooly: `entita.akce` (`invoice.extract`, `payment.createOrder`).
- Agenti: `kebab-case` role (`invoice-processor`).
- Branded typy: `TenantId`, `SvjId`, `UserId`, `InvoiceId`… vytvořené přes `brand()` z kernelu. Funkce přijímající více ID přijímají objekt, ne poziční argumenty.
- Booleovské názvy: `isX`, `hasX`, `canX`. Funkce: sloveso + objekt (`matchTransactions`, `postInvoiceToAccounting`).

## 4. Clean code – co linter nechytí

- Funkce dělá jednu věc a jmenuje se podle toho. Cca do 30 řádků; delší funkce je signál k rozdělení, ne pravidlo, které se obchází.
- Žádné boolean parametry (`createTask(x, true)`). Použij objekt s pojmenovanými poli nebo dvě funkce.
- Early return místo vnořených podmínek. Max. 2 úrovně vnoření.
- Výjimky pro výjimečné stavy, návratové hodnoty pro očekávané výsledky (`match: { status: 'matched' | 'ambiguous' | 'unmatched' }`).
- Žádné magické konstanty – pojmenované konstanty u místa použití nebo v `domain/constants.ts`.
- Komentář vysvětluje **proč**, nikdy **co**. Když potřebuješ komentář na „co", přepiš kód.
- Žádný „defensive“ kód proti stavům, které typový systém vylučuje.
- Nepřidávej abstrakci pro jeden případ použití. Tři podobné bloky = kandidát na abstrakci, dva = ne.
- Immutability: `readonly`, `as const`, spread místo mutace. Mutace jen v lokálním rozsahu s jasným důvodem.
- Async: žádné `await` v cyklu nad položkami, když jde použít dávkový dotaz. Žádné nezpracované promise (lint `no-floating-promises`).

## 5. Service vrstva

- Service je třída s DI (NestJS), bez I/O mimo repository (Drizzle přes `withTenant`) a adaptery.
- Každá veřejná metoda přijímá `ctx: RequestContext` (tenant, actor, correlationId) jako první argument.
- Service emituje eventy přes `events.emit(ctx, event)` uvnitř transakce (outbox tabulka; workers doručují). Nikdy neemituj event z controlleru, toolu nebo agenta.
- Mutace zapisují `audit_log` explicitním `audit.record(ctx, { action, entity, reason, … })` uvnitř transakce z `withTenant` (ADR 0011).
- Deterministické zpracování je v service (`matchTransactions`); agentní residuál se emituje jako jeden dávkový event.

## 6. Tooly a agenti

- `defineTool({ name, description, input, output, permission, approval, userComposable, model?, handler })`. `description` píšeš pro model: co dělá, kdy použít, co vrací. Vstup i výstup zod.
- `approval(ctx, input)` vrací `{ required, approvers, deadline? }`. Handler toolu s `required: true` volá runtime až po rozhodnutí; test na to je povinný.
- `defineAgent({ name, version, description, triggers, schedule?, scope, model, tools, autonomy, prompt, subagents? })`. Prompt v `prompt.md` vedle definice, česky, se sekcemi: Role, Kontext, Postup, Pravidla, Výstup.
- Agent nikdy nedostane tool mimo `tools` a nikdy neběží mimo `scope`. Runtime to vynucuje; agent se na to nespoléhá promptem.
- Každý běh: `agent_run` + Langfuse trace + rozpočet tokenů. Překročení = `failed_budget` + úkol.
- Prompt netvrdí nic, co runtime nevynucuje („nesmíš platit" je zbytečné – tool to prostě neumožní).

## 7. Testy

- Umístění: `tests/` ve feature, `*.test.ts` (unit), `*.int.test.ts` (integrační, Postgres), `*.contract.test.ts` (adaptery), `*.eval.ts` (LLM evaly, mimo `verify`).
- Unit: service s mockovanými repository/adaptery. Nepiš unit test, který jen opakuje implementaci.
- Integrační: testcontainers Postgres, migrace se aplikují, každý test běží ve vlastní transakci s rollbackem. Povinné pro: RLS izolaci každé tabulky, migrace, složitější dotazy.
- Contract: jedna sada testů (`describeAdapterContract(factory)`) běží proti mocku a – s env proměnnou – proti reálné implementaci.
- Agenti: `runAgentInTest(agent, event, { tools: mocks, llm: replay('fixtures/x.json') })`. Ověřuje se volaná sekvence toolů a výsledek, ne text.
- Evaly: `fixtures/evals/<agent>/` golden dataset, skóre reportované do Langfuse. Spouští se `pnpm test:evals`, ne v CI.
- Coverage prahy: kernel 90 %, features service 80 %, ui bez prahu.

## 8. Databáze

- Schéma jen v `features/*/schema.ts`; `packages/db` je skládá. Migrace generuje Drizzle Kit, jsou commitované a neupravují se zpětně.
- Každá tabulka s `tenant_id` má RLS policy generovanou helperem `tenantTable()` z kernelu. Ruční policy = ADR.
- Destruktivní migrace (drop sloupce/tabulky, změna typu) jen s ADR.
- Seed je idempotentní (`upsert` podle stabilních klíčů), anonymizovaný, žije ve `features/*/seed/`.

## 9. Chyby a logování

- Taxonomie: `DomainError` (porušení pravidla), `NotFoundError`, `ForbiddenError`, `ValidationError` (zod na hranici), `AdapterError` (externí systém, s `retryable`), `ConflictError` (sync). Vše z kernelu, vše s `code` a `details`.
- API mapuje na HTTP; tool runtime mapuje na výsledek pro model (`{ error: { code, message } }`), nikdy nevyhazuje stack modelu.
- Logger vždy s `tenantId`, `correlationId`, a kde existuje `agentRunId`, `svjId`. Úroveň `info` pro doménové kroky, `debug` pro detail, `warn` pro retry, `error` jen s akcí pro člověka.
- Nikdy nelogovat osobní data vlastníků, obsah dokumentů ani tokeny.

## 10. Git a proces

- Conventional commits: `feat(invoices): …`, `fix(kernel): …`, `docs(adr): …`, `chore: …`. Scope = feature/package.
- Jeden commit = jeden logický celek. Žádné „wip".
- Pre-commit (lefthook): lint-staged (eslint --fix, prettier), gitleaks, commitlint.
- PR/úkol popisuje: co, proč, jak testováno, co je mimo rozsah. Šablona v `.github/PULL_REQUEST_TEMPLATE.md`.
- ADR: `docs/adr/NNNN-title.md`, MADR formát, statusy `Proposed → Accepted → Superseded/Deprecated`. `pnpm adr:new`.

## 11. Jak přidat…

**Feature:** `pnpm gen:feature <name>` → `schema.ts` (přes `tenantTable`) → `domain/` (typy, eventy) → `service/` → testy (unit + RLS int) → `api/` nebo `tools/` → `index.ts` jen s potřebnými exporty → `pnpm verify`.

**Tool:** `pnpm gen:tool <feature> <name>` → zod vstup/výstup → `permission`, `approval` → handler volá service → test (včetně approval, pokud `required`) → `pnpm verify`. Registrace je automatická.

**Agent:** `pnpm gen:agent <feature> <name>` → definice + `prompt.md` → ověř, že spouštěcí event je agentní (dávkový, residuál) → replay test → volitelně eval fixture → `pnpm verify`.

**Subscriber:** `pnpm gen:subscriber <feature> <event> <name>` → soubor `subscribers/<name>.ts`, který `subscribe()` zavolá při importu; `apps/workers` ho najde globem `packages/features/*/subscribers/*.ts`, nic ho neimportuje ručně. Handler dostane kontext tenantu eventu s aktérem `system` a volá service feature – sám do databáze nesahá. Doručení je at-least-once, takže handler musí být idempotentní; výchozí klíč je `eventId`. Jméno subscribera je půlka jména fronty (`<event>/<feature>.<name>`), takže se nepřejmenovává na lehkou váhu. Agent je subscriber taky – tohle je varianta bez LLM, a podle „kód první, agent na zbytek" je to ta preferovaná.

**Adapter:** rozhraní v `adapters/<name>.adapter.ts` → `<name>.mock.ts` → contract test → reálná implementace (pokud existuje) → volba implementace přes DI podle env.
