# Domovník – AI-native platforma pro správu nemovitostí (zadání dema)

**Verze:** 0.7
**Změny v 0.2:** napojení na Pohodu místo vlastních financí, MCP tokeny s výběrem toolů, uživatelsky definovaní agenti
**Změny v 0.3:** rozdělení účetní integrace na `AccountingAdapter` (jisté agendy Pohody) a `ReceivablesAdapter` (předpisy a saldo vlastníků, více implementací); ověření XML přes POHODA Start
**Změny v 0.4:** uzavřeny otevřené otázky – Drizzle, vlastní auth, Gemini pro přepis, schvalování v UI i e-mailem, název Domovník
**Změny v 0.5:** monorepo přestavěno na feature-based (vertical slices) architekturu
**Změny v 0.6:** princip „kód první, agent na zbytek“, batch eventy, `withTenant` pojistka pro RLS, schvalování z e-mailu přes POST, limity agent runtime, zpřesnění Pohody
**Změny v 0.7:** doplněny features `demo`, `suppliers`, `comms` (fáze 2), agent `quote-evaluator`, fáze 2 rozšířena o úkoly vzniklé z fáze 1 (zpětné doplnění po úkolu 027 – backfill ADR za odchylky fáze 1)
**Datum:** 2026-09-26
**Stav:** uzavřený rozsah, připraveno k detailnímu návrhu fáze 1

---

## 1. Cíl a rozsah

Cílem je demo aplikace, která potenciálním zákazníkům (správcovským firmám) ukáže, jak vypadá správa SVJ postavená od základu kolem AI agentů. Nejde o produkčně kompletní systém – jde o věrohodnou ukázku, ve které:

- vlastníkem systému je **správcovská firma** (tenant), jejími klienty jsou jednotlivá **SVJ**,
- AI agenti nejsou doplněk, ale plnohodnotní aktéři systému s identitou, oprávněními a auditem,
- klíčové procesy (faktury, revize, úkoly, dluhy, vlastníci, shromáždění) běží end-to-end s člověkem jen na schvalovacích bodech,
- agenti jsou snadno rozšiřitelní bez zásahu do jádra.

**Mimo rozsah demo verze:** vlastní účetnictví (zdrojem pravdy je Pohoda), reálné napojení na Pohoda mServer (demo = mock), reálné PSD2 napojení bank, reálné napojení na katastr (WSDP), mzdy, fakturace správcovské firmy vůči SVJ, mobilní nativní aplikace (stačí PWA), datové schránky.

## 2. Principy

1. **Agenti jsou uživatelé.** Každý agent má vlastní identitu (`actor_type = agent`), role a oprávnění. Každá změna v systému nese `actor_id`, `reason` a odkaz na běh agenta (trace).
2. **Vše je událost.** Doménové změny se zapisují do event logu; agenti reagují na události, ne na kliknutí uživatele.
3. **Human-in-the-loop je entita, ne výjimka.** Akce s dopadem (platba, odeslání dopisu vlastníkovi, objednávka) končí jako `Approval`, které schválí oprávněná osoba. Rozhodnutí, co vyžaduje schválení, je vlastností nástroje, nikoli agenta.
4. **Jeden zdroj pravdy pro schopnosti.** Service vrstva obsluhuje REST API, MCP server i agentní tooly. Cokoli umí UI, umí i agent.
5. **Striktní scoping.** Agent běží vždy v kontextu tenantu a (typicky) jednoho SVJ. Cross-SVJ pohled je explicitní oprávnění.
6. **Vše dohledatelné.** Každý běh agenta má trace v Langfuse, každé rozhodnutí je vysvětlitelné z dat, která agent viděl.
7. **Neduplikovat, integrovat.** Firmy mají zavedené účetnictví; aplikace se napojuje (Pohoda), nenahrazuje ho. Naše přidaná hodnota je vrstva nad ním: procesy, agenti, schvalování.
8. **Agenti bez vývojáře.** Systémoví agenti jsou v kódu, ale stejná definice je dostupná v UI – uživatel s oprávněním si složí vlastního agenta z předdefinovaných toolů.
9. **Kód první, agent na zbytek.** Vše, co lze rozhodnout deterministicky (párování podle VS a částky, kontrola termínů revizí, duplicita faktury, výpočet salda), dělá service vrstva. Agent dostává pouze **residuál** – případy, které kód nerozhodl – a pouze pro ně se emituje spouštěcí event. LLM není nikdy ve smyčce nad hromadnými daty.

## 3. Architektura

### 3.1 Monorepo (TypeScript) – feature-based architektura

Kód je organizován podle **features (vertical slices)**, ne podle technických vrstev. Jediná horizontální vrstva je `kernel`; vše ostatní je feature, která drží u sebe DB schéma, doménu, service, tooly, agenty, API i UI.

```
/apps
  /web          Next.js – pouze routing, layout, composition (UI importuje z features)
  /api          NestJS – pouze bootstrap, importuje NestJS moduly z features
  /workers      NestJS standalone – bootstrap agent runtime, agenti načteni z features
  /mcp          MCP server – bootstrap, tooly z registru

/packages
  /kernel       tenant, auth, RLS kontext, event bus, approvals, audit,
                registr toolů (defineTool), registr agentů (defineAgent), agent runtime
  /shared       UI kit, utils, i18n, testovací helpery
  /db           composition: seskládá drizzle schéma ze všech features, migrace, seed runner

  /features
    /svj              /invoices         /payments         /receivables
    /owners           /cadastre         /documents        /knowledge
    /inspections      /defects          /tasks            /quotes
    /field-reports    /fleet            /comms            /assemblies
    /dunning          /accounting-sync  /reports          /copilot
    /agent-builder    /api-tokens       /demo             /suppliers
```

**Kostra každé feature** (prázdné složky se vynechají):

```
/features/invoices
  index.ts            jediný veřejný vstup – co smí ostatní features importovat
  schema.ts           drizzle tabulky této feature
  domain/             entity, zod DTO, doménové eventy (finance.invoice.*)
  service/            business logika; jediné místo mutací, emituje eventy
  tools/              defineTool(...) nad service
  agents/             defineAgent(...) – např. invoice-processor
  api/                NestJS modul + controllers
  ui/                 React komponenty a stránky (Next.js je pouze montuje do rout)
  adapters/           rozhraní na externí systémy + mock implementace
  seed/               demo data feature
  tests/
```

**Pravidla závislostí** (vynucená lint pravidlem na importy):

1. Feature importuje z jiné feature pouze přes její `index.ts`, nikdy z vnitřních cest.
2. Preferovaná vazba mezi features je **událost** (`invoices` emituje `finance.invoice.approved`, `accounting-sync` na ni reaguje). Přímý import service je povolen jen pro synchronní čtení.
3. Cyklické závislosti mezi features jsou zakázány; jejich vznik je signál k přesunu do kernelu nebo k rozdělení feature.
4. `kernel` nezná žádnou feature; features znají `kernel` a `shared`.
5. Registrace toolů, agentů, drizzle schémat a NestJS modulů probíhá **automaticky podle konvence** (`features/*/tools`, `features/*/agents`, `features/*/schema.ts`, `features/*/api`). Přidání feature = nová složka; `apps/*` se nemění.
6. UI žije v `features/*/ui`; `apps/web` má v `next.config` `transpilePackages` pro všechny features a `shared`. Konvence: soubory v `ui/` jsou server components, klientské komponenty mají příponu `.client.tsx` a explicitní `"use client"`. Stránka v `apps/web/app/...` je jednořádkový re-export z feature.

Finance jsou záměrně rozděleny na `invoices`, `payments`, `receivables` a `accounting-sync` – každá má jinou životnost a jiné adaptery.

**Mapování features na kapitoly zadání:** `svj` (kap. 4 Tenant/SVJ), `invoices`/`payments`/`receivables`/`accounting-sync` (Finance, kap. 8 Pohoda), `owners`/`cadastre` (vlastníci, katastr), `documents`/`knowledge` (dokumenty a znalosti), `inspections`/`defects`/`tasks`/`quotes`/`field-reports`/`fleet` (Provoz), `comms`/`assemblies`/`dunning` (komunikace a governance), `reports`/`copilot` (přehledy), `agent-builder` (kap. 6.4), `api-tokens` (kap. 9), `demo` (kap. 10 – scénáře a reset ukázky), `suppliers` (dodavatelé a smlouvy, kap. 8 – vyčleněno z `invoices`, fáze 2).

Tři features nemají vlastní kapitolu, protože vznikly refaktorem/backfillem po fázi 1 (úkol 027): `demo` drží spouštění scénářů a reset ukázky (dřív součást `invoices`/`payments`/`accounting-sync`); `suppliers` drží dodavatele a smlouvy vyčleněné z `invoices`, protože je potřebují i `inspections`/`quotes` (fáze 2); `comms` je ve fázi 2 jen odchozí pošta (simulovaný adapter), příchozí pošta zůstává ve fázi 1 v `invoices` a sjednotí se až ve fázi 3.

### 3.2 Infrastruktura

- **Postgres 16 + pgvector** – jediná databáze: doménová data, event log, fronta úloh (`pg-boss`), embeddingy dokumentů.
- **Object storage** – lokálně MinIO, v AWS S3 (dokumenty, faktury, přílohy, foto od techniků).
- **Langfuse** – observabilita agentů.
- **Lokálně:** `docker compose` (postgres, minio, api, web, workers, mcp, langfuse).
- **Produkce (předpoklad):** AWS ECS/Fargate pro api/web/workers/mcp, RDS Postgres, S3, Secrets Manager. Stejné kontejnerové image jako lokálně.

### 3.3 Modely

- Anthropic Claude přes Agent SDK. Výchozí: Sonnet pro agenty, Haiku pro extrakci/klasifikaci. Volba modelu je součástí definice agenta.
- Embeddingy a přepis audia (hlášení techniků, záznam shromáždění): Gemini, přes adapter s možností výměny.

### 3.4 Technická rozhodnutí

- **ORM:** Drizzle. Row-level security v Postgresu; každý request i běh agenta nastaví v transakci `SET LOCAL app.tenant_id` (a `app.actor_id`). **Pojistka v kernelu:** DB je dostupná výhradně přes `withTenant(ctx, fn)`, který otevře transakci, nastaví kontext a poskytne instanci Drizzle; přímý přístup mimo wrapper není exportován. Platí pro API, workery i MCP. Integrační test: pod cizím tenantem každá tabulka vrací 0 řádků a zápis selže.
- **Auth:** vlastní (NestJS + Passport): session cookie pro web, API tokeny pro MCP/REST (kap. 9), jednorázové podepsané odkazy pro e-mailové schvalování. Navrženo tak, aby šlo v AWS vyměnit za Cognito.
- **Schvalování výborem:** obojí – UI (primární, inbox approvals) i e-mail s podepsaným odkazem vedoucím na tutéž obrazovku; odkaz opravňuje pouze k rozhodnutí o daném approval, k ničemu dalšímu. Odkaz je **pouze GET na stránku s náhledem a tlačítky**, samotné rozhodnutí je POST – anti-spam skenery, které odkazy z e-mailů otevírají, tak nic neschválí.
- **Název:** Domovník (tagline „AI správa domů"); agenti prezentováni jako „domovníkovi pomocníci".

## 4. Datový model (jádro)

Všechny doménové tabulky mají `tenant_id`; tabulky vázané na SVJ mají navíc `svj_id`. Row-level security v Postgresu podle `tenant_id`.

**Tenant a organizace**

- `tenant` – správcovská firma
- `department` – oddělení (údržba, finance, úklid, technici, správa)
- `user` – lidé (správci, technici, členové výborů, vlastníci) s rolemi
- `agent_identity` – agenti jako aktéři (název, verze, role)

**SVJ a nemovitost**

- `svj` – základní údaje, IČO, bankovní účty, výbor
- `building`, `unit` – jednotky s podílem na společných částech, typ (byt/nebyt/garáž)
- `owner`, `ownership` – vlastník, vazba na jednotku, podíl, období vlastnictví; `source = catastre|manual`
- `contact` – kontakty vlastníků s příznaky `verified`, `consent`
- `cadastre_snapshot`, `cadastre_change` – snímky z katastrálního adapteru a detekované změny

**Finance (provozní kopie, zdroj pravdy = Pohoda)**

- `accounting_link` – vazba SVJ na účetní jednotku v Pohodě (každé SVJ je v Pohodě samostatná účetní jednotka), stav synchronizace, zvolená implementace `ReceivablesAdapter`
- `bank_account`, `bank_transaction` – pohyby; primárně import z Pohody (bankovní výpisy), volitelně přímo z banky
- `prescription` – předpis plateb vlastníků; zdroj dle `ReceivablesAdapter` (import z Pohody = read-only, interní evidence = editovatelné)
- `owner_balance` – saldo vlastníka; zdroj dle `ReceivablesAdapter`
- `payment_matching` – párování transakce ↔ předpis/faktura provedené agentem; výsledek se zapisuje zpět do Pohody (likvidace)
- `supplier`, `contract` – dodavatelé (synchronizace s adresářem Pohody) a smlouvy SVJ (naše)
- `invoice` – přijatá faktura, extrahované položky, stav (`received → extracted → matched → pending_approval → approved → posted → paid`); `posted` = zapsáno do Pohody, `pohoda_id` odkaz
- `budget` – rozpočet SVJ po kategoriích (naše), skutečnost čtena z Pohody
- `sync_job`, `sync_conflict` – běhy synchronizace a konflikty k ručnímu řešení

**Provoz**

- `inspection_type`, `inspection` – revize (elektro, plyn, výtah, hasicí přístroje, komíny…), periodicita, termín, stav, revizní zpráva
- `defect` – závada (z revize, z hlášení technika, od vlastníka)
- `task` – úkol, přiřazení na oddělení/osobu, priorita, termín, vazba na entitu původu
- `quote_request`, `quote` – poptávky a nabídky dodavatelů
- `vehicle`, `vehicle_event` – vozový park (STK, pojištění, servis), přiřazení technikům, kniha jízd

**Dokumenty a znalosti**

- `document` – metadata, verze, S3 klíč, kategorie, vazba na SVJ
- `document_chunk` – chunky s embeddingem
- `knowledge_entry` – destilované znalosti SVJ (co je kde, kdo co řeší, zvyklosti)

**Komunikace a governance**

- `message` – příchozí/odchozí zprávy (e-mail, web formulář), vlákno, klasifikace
- `assembly` – shromáždění: program, podklady, pozvánka, zápis, usnesení
- `dunning` – upomínky (stupeň, stav, doručení)

**Agentní vrstva**

- `agent_definition` – definice agenta (systémový = načtený z kódu, uživatelský = vytvořený v UI), stejný tvar jako v kap. 6.1, verzováno
- `agent_config` – per-tenant/per-SVJ override (autonomie, model, zapnuto/vypnuto)
- `api_token` – MCP/API token: vlastník, název, hash, povolené tooly, rozsah SVJ, expirace, poslední použití, revokace
- `event` – doménový event log (typ, payload, actor, correlation_id)
- `agent_run` – běh agenta (agent, trigger event, stav, trace_id, výsledek, náklady)
- `approval` – návrh ke schválení (co, kdo navrhl, evidence, oprávnění schvalovatelé, deadline, rozhodnutí)
- `audit_log` – každá mutace s actor a reason

## 5. Event model

Události jsou typované (zod) a pojmenované `doména.entita.akce`, např.:

`finance.invoice.received`, `finance.invoice.extracted`, `finance.invoice.posted`, `finance.transaction.imported`, `finance.approval.decided`, `finance.sync.conflict`, `ops.inspection.due_soon`, `ops.inspection.report_uploaded`, `ops.defect.created`, `ops.task.created`, `ops.task.overdue`, `field.report.submitted`, `owners.cadastre.change_detected`, `owners.contact.missing`, `comms.message.received`, `governance.assembly.scheduled`, `fleet.vehicle.event_due`.

Události vznikají v service vrstvě (ne v controllerech) – tím je zaručeno, že MCP, REST i agenti generují stejné události. Plánovač (`workers`) emituje časové události (`*.due_soon`, denní/měsíční tiky).

**Dva druhy událostí:**

- _Doménové_ (`finance.transactions.imported` – jeden event na celý výpis, `ops.inspection.report_uploaded`) – zapisují se vždy, slouží auditu a integracím.
- _Agentní_ (`finance.transactions.unmatched`, `finance.invoice.needs_review`) – emituje service vrstva až po deterministickém zpracování, pouze pro residuál, a **vždy jako dávka** (jeden event s N položkami), ne per položka. Agenti se přihlašují primárně k agentním událostem.

## 6. Agentní framework a rozšiřitelnost

### 6.1 Definice agenta

Každý agent je jeden soubor v `packages/agents/<name>/agent.ts`, který exportuje deklarativní definici:

```ts
export default defineAgent({
  name: 'invoice-processor',
  version: '1.0.0',
  description: 'Zpracuje přijatou fakturu: extrakce, párování, kontrola, návrh schválení.',
  triggers: [{ event: 'finance.invoice.received' }],
  schedule: undefined, // nebo cron pro periodické agenty
  scope: 'svj', // 'svj' | 'tenant'
  model: 'sonnet',
  tools: [
    'invoice.getWithAttachments',
    'invoice.extract',
    'contract.findForSupplier',
    'budget.getCategoryStatus',
    'invoice.detectAnomalies',
    'approval.create',
  ],
  autonomy: 'propose', // 'read' | 'propose' | 'act'
  prompt: promptFromFile('./prompt.md'), // verzované, může být přepsáno v DB
  subagents: [], // volitelné (Agent SDK)
});
```

**Runtime limity:** konfigurovatelná souběžnost per agent a per tenant, fronta s prioritou, retry s backoffem na rate limit API, rozpočet tokenů per běh; překročení končí běh jako `failed_budget` a založí úkol. Modelový tiering: Haiku pro extrakci/klasifikaci, Sonnet pro rozhodování – volba je v definici agenta a v toolech (extrakční tooly mají model vlastní).

**Registr** načte všechny agenty podle konvence adresářů při startu workerů. Přidání agenta = nový adresář, žádná změna jádra. Framework zajišťuje: subscribe na eventy, vytvoření `agent_run`, sestavení kontextu (tenant, SVJ, trigger payload, relevantní `knowledge_entry`), spuštění přes Agent SDK, trace do Langfuse, zápis výsledku.

### 6.2 Registr toolů

Tooly žijí v `packages/tools`, každý s zod schématem vstupu/výstupu, popisem pro model, požadovaným oprávněním a **politikou schvalování**:

```ts
defineTool({
  name: 'payment.createOrder',
  description: 'Vytvoří příkaz k úhradě z účtu SVJ.',
  input: z.object({ invoiceId: z.string(), amount: z.number(), ... }),
  permission: 'finance.pay',
  approval: (ctx, input) => ({ required: true, approvers: ctx.svj.committee }),
  handler: async (ctx, input) => paymentService.createOrder(ctx, input),
});
```

Tentýž registr:

- sestavuje tool sadu pro agenty (filtrovanou podle `tools` v definici a podle oprávnění agentní identity),
- generuje tooly pro MCP server (filtrované podle oprávnění přihlášeného uživatele).

Tool s `approval.required = true` nikdy neprovede handler přímo – vytvoří `Approval` a vrátí agentovi informaci, že akce čeká na schválení. Agent to tedy nemůže obejít.

### 6.3 Autonomie

| Úroveň    | Význam                                                               |
| --------- | -------------------------------------------------------------------- |
| `read`    | pouze čte a produkuje analýzu/report                                 |
| `propose` | smí vytvářet návrhy (`Approval`, drafty), úkoly a interní záznamy    |
| `act`     | smí volat tooly bez schválení tam, kde tool sám schválení nevyžaduje |

Úroveň je horní limit; tool může být přísnější. Správce může úroveň konkrétního agenta pro konkrétní SVJ snížit (konfigurace v DB).

### 6.4 Systémoví vs. uživatelští agenti

Definice z 6.1 je deklarativní, proto je uložitelná i mimo kód. Existují dva zdroje agentů se stejným runtime:

|                        | Systémoví                                                        | Uživatelští                                                                     |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Kde vzniká             | kód (`packages/agents`), načten do `agent_definition` při startu | UI „Tvorba agenta", uložen do `agent_definition`                                |
| Kdo upravuje           | vývojář                                                          | uživatel s rolí `agent_author`                                                  |
| Tooly                  | libovolné z registru                                             | jen tooly označené `userComposable: true` a jen ty, na které má autor oprávnění |
| Autonomie              | dle definice                                                     | max. úroveň daná rolí autora; `act` vyžaduje schválení správce tenantu          |
| Subagenti, vlastní kód | ano                                                              | ne (jen tooly + prompt)                                                         |

**UI tvorby agenta (průvodce):**

1. Název, popis, rozsah (jedno SVJ / všechna SVJ tenantu).
2. Spouštěč: výběr z katalogu událostí (s popisem a ukázkovým payloadem) nebo rozvrh (cron s náhledem „příště poběží…").
3. Tooly: výběr ze seznamu s popisem, u každého označeno, zda vyžaduje schválení.
4. Instrukce (prompt) – volný text; k dispozici šablony a proměnné kontextu (`{svj.name}`, `{event.payload}`).
5. Autonomie.
6. **Sandbox / dry-run:** agent se spustí nad reálnými daty s vybranou historickou událostí; mutující tooly se neprovádějí, jen logují „co by udělaly". Výsledek je vidět včetně trace.
7. Aktivace – verze 1; každá další úprava vytvoří novou verzi, historie a rollback.

Systémoví agenti mohou být použiti jako šablona („duplikovat a upravit") – z toho vzniká uživatelský agent.

### 6.5 Konfigurace a verzování

- Prompty systémových agentů jsou soubory v repu; `agent_config` umožňuje per-tenant/per-SVJ override modelu a autonomie.
- Každá verze definice je neměnná; `agent_run` odkazuje na použitou verzi. Vypnutí agenta je konfigurace, ne smazání.

## 7. Katalog agentů (demo)

| Agent                      | Trigger                                                                                 | Klíčové tooly                                          | Výstup / gate                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `invoice-processor`        | `finance.invoice.received` (po deterministické kontrole duplicity a načtení dodavatele) | extrakce, smlouvy, rozpočet, anomálie                  | `Approval` pro výbor s evidencí; při schválení `accounting.postInvoice` (zápis do Pohody) + `payment.createOrder`                               |
| `payment-matcher`          | `finance.transactions.unmatched` (dávka residuálů po SQL párování)                      | předpisy, faktury, historie plátce, likvidace v Pohodě | návrh párování pro nejasné platby (překlep ve VS, chybějící VS, sdružená platba) → `Approval` finance; jednoznačné platby páruje kód bez agenta |
| `accounting-sync-guard`    | `finance.sync.conflict`, denní tik                                                      | stav synchronizace, rozdíly                            | úkol pro finance s popisem konfliktu (např. faktura v Pohodě změněna mimo aplikaci)                                                             |
| `debt-collector`           | měsíční tik                                                                             | saldo vlastníků, historie komunikace                   | návrh upomínek (`Approval` správce)                                                                                                             |
| `inspection-planner`       | `ops.inspection.due_soon`                                                               | kalendář revizí, dodavatelé, poptávky                  | poptávka technikům (`Approval`), naplánování termínu                                                                                            |
| `quote-evaluator`          | `ops.quote_request.ready_for_decision`                                                  | porovnání nabídek, dodavatelé                          | doporučení přidělení zakázky (`Approval` výboru) podle `quote.compare`                                                                          |
| `inspection-report-reader` | `ops.inspection.report_uploaded`                                                        | extrakce zprávy, závady                                | `defect` + `task` s prioritou a odhadem                                                                                                         |
| `field-dispatcher`         | `field.report.submitted`                                                                | klasifikace, oddělení, úkoly                           | rozpad hlášení technika na úkoly pro údržbu/finance/úklid                                                                                       |
| `owner-support`            | `comms.message.received`                                                                | KB SVJ, saldo, dokumenty, revize                       | draft odpovědi (`Approval` správce; jednoduché dotazy `act` dle konfigurace)                                                                    |
| `cadastre-watcher`         | denní tik → `owners.cadastre.change_detected`                                           | katastrální adapter, vlastnictví, saldo                | proces převodu jednotky: úkoly, dopis novému vlastníkovi, kontrola dluhu, přepočet podílů                                                       |
| `contact-curator`          | `owners.contact.missing`, týdenní tik                                                   | kontakty, šablony                                      | návrh výzvy k doplnění kontaktu                                                                                                                 |
| `assembly-assistant`       | `governance.assembly.scheduled`, nahrání záznamu                                        | dokumenty, finance, šablony                            | podklady, program, pozvánka; po shromáždění zápis a usnesení                                                                                    |
| `fleet-manager`            | `fleet.vehicle.event_due`, denní tik                                                    | vozidla, úkoly techniků                                | připomínky STK/pojištění, návrh rozvrhu výjezdů                                                                                                 |
| `copilot`                  | dotaz uživatele (UI/MCP)                                                                | všechny read tooly v rozsahu oprávnění                 | odpověď nad daty, cross-SVJ jen s oprávněním                                                                                                    |
| `monthly-reporter`         | měsíční tik                                                                             | finance, úkoly, revize, dluhy                          | report pro výbor SVJ (`Approval` správce před odesláním)                                                                                        |

## 8. Vstupní kanály a adaptéry

Každý externí systém je za rozhraním (`interface`) s demo implementací a místem pro reálnou:

- **Pohoda – účetnictví** – `AccountingAdapter` s implementací `PohodaMServerAdapter` (XML API mServeru přes HTTP). Zúženo na agendy, které jsou v Pohodě jisté a mají veřejně dokumentované XML schéma: přijaté faktury (zápis po schválení), likvidace (párování úhrad), adresář (dodavatelé), bankovní výpisy, skutečnost k rozpočtu. Sync je inkrementální (podle ID/data změny) s detekcí konfliktů. Likvidace (párování úhrad) je v Pohodě nejcitlivější agenda (číselné řady, předkontace, členění DPH) – mock tyto vazby respektuje a pro demo je přijatelný fallback „faktura zapsána, likvidace potvrzena ručně v Pohodě“. POHODA Start má limit počtu záznamů, ne funkcí; pro ověření schémat stačí. **Realita produkce:** mServer běží jen na Windows v síti zákazníka → bude potřeba lehký konektor u zákazníka (Windows služba, outbound spojení do cloudu) nebo VPN; v zadání dema pouze rozhraní + mock. Demo: `PohodaMockAdapter` mluvící stejným XML schématem (`dataPack`), naplněný seed daty.
- **Předpisy a saldo vlastníků** – samostatné rozhraní `ReceivablesAdapter`, protože Pohoda nemá SVJ modul a správcovské firmy to vedou různě. Implementace: `PohodaOtherReceivablesAdapter` (předpisy jako _Ostatní pohledávky_ na vlastníka, mock podle veřejného schématu), `InternalReceivablesAdapter` (vlastní evidence pro firmy bez systému – v demu výchozí, plně funkční), do budoucna adaptery na specializované SVJ systémy. Volba je per SVJ v `accounting_link`. Prezentační argument: „napojíme se na to, co používáte".
- **Ověření XML schémat** – před fází 1 nainstalovat POHODA Start (zdarma) na Windows VM, zapnout mServer a ověřit reálný round-trip pro faktury, banku, adresář a likvidaci; mock se odvíjí od ověřených odpovědí, ne jen od dokumentace.
- **E-mail** – IMAP/webhook adapter; demo: simulovaná schránka + tlačítko „doručit fakturu / dotaz vlastníka" v admin UI.
- **Banka** – primárně přes Pohodu (výpisy). Přímý `BankAdapter` (Fio) volitelný pro rychlejší notifikace; demo: syntetický generátor pohybů zapsaný do mock Pohody (včetně chybějících plateb a překlepů ve VS).
- **Katastr** – `CadastreAdapter` s rozhraním podle WSDP (výpis jednotek, vlastníků, řízení); demo: mock s daty a scénářem „převod jednotky", „zástavní právo".
- **Terén** – PWA pro techniky: hlasová poznámka (přepis), foto, výběr SVJ/jednotky → `field.report.submitted`.

## 9. MCP server a API tokeny

- Autentizace **tokenem**, který si uživatel vygeneruje v UI (Nastavení → API a MCP přístup). Token je zobrazen jednou, ukládá se jen hash.
- Při vytváření tokenu uživatel zvolí: název, **podmnožinu toolů** (checklist ze seznamu toolů, na které má oprávnění; přednastavené sady „jen čtení", „správce", „výbor"), **rozsah SVJ** (všechna / vybraná), expiraci.
- Invariant: token nikdy nemá víc oprávnění než jeho vlastník; při odebrání role uživateli se tooly z tokenu automaticky odfiltrují. Approval politika toolů platí bez výjimky.
- MCP server po připojení vystaví jen tooly povolené v tokenu; stejný registr jako pro agenty a REST.
- Audit: každé volání přes token je v `audit_log` s `actor = user` + `via = api_token:<id>`; v UI přehled tokenů s posledním použitím a revokací.
- Resource endpoints: dokumenty SVJ, přehledy, stav approvals.

## 10. Demo data (3 SVJ, anonymizováno)

| SVJ                       | Profil                                           | Co ukazuje                                                     |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| A – malé (12 jednotek)    | bezproblémové, kladný fond                       | rutinní faktury, revize, klidný měsíční report                 |
| B – velké (80 jednotek)   | 3 dlužníci, převod jednotky, exekuce na jednotce | dluhy, katastr, upomínky, cross-SVJ srovnání                   |
| C – střední (40 jednotek) | probíhá rekonstrukce střechy                     | poptávky, nabídky, faktury nad rozpočet, anomálie, shromáždění |

Seed obsahuje: 12 měsíců bankovních pohybů, sadu faktur (PDF), smlouvy, plán revizí s 2 blížícími se termíny, revizní zprávu se závadami, dokumenty pro KB, 3 vozidla, 2 techniky.

## 11. Fáze implementace

### Fáze 1 – Páteř + fakturační scénář

- Monorepo, docker compose, Postgres, NestJS moduly (tenant, svj, users, auth, events, approvals, audit).
- Registr toolů, registr agentů (`agent_definition` v DB, načítání systémových agentů z kódu), worker runtime nad Agent SDK, Langfuse.
- Ověření XML na POHODA Start (viz kap. 8).
- `AccountingAdapter` rozhraní + `PohodaMockAdapter` (XML `dataPack`): faktury, výpisy, adresář, likvidace.
- `ReceivablesAdapter` rozhraní + `InternalReceivablesAdapter` (výchozí) + `PohodaOtherReceivablesAdapter` (mock).
- Agenti: `invoice-processor`, `payment-matcher`.
- UI: přihlášení, výběr SVJ, inbox approvals, detail faktury s evidencí agenta, přehled plateb, stav synchronizace s Pohodou.

**Akceptační kritéria:**

- Doručení faktury e-mailem (simulace) vede bez zásahu k `Approval` s extrahovanými údaji, spárovanou smlouvou, stavem rozpočtové kategorie a případnou anomálií.
- Schválení členem výboru zapíše fakturu do (mock) Pohody a vytvoří příkaz k úhradě; import odpovídající transakce z Pohody fakturu automaticky zlikviduje a uzavře **bez zapojení agenta** (SQL párování).
- Import výpisu s 200 pohyby, z nichž 195 je jednoznačných, spustí právě jeden běh `payment-matcher` s 5 residuály.
- Test `withTenant`: dotaz mimo wrapper vyhodí výjimku; pod cizím tenantem jsou všechny tabulky prázdné.
- Změna faktury provedená přímo v Pohodě je detekována jako konflikt a založí úkol.
- Každý krok je dohledatelný v `agent_run` + Langfuse; audit log obsahuje actor a reason.
- Nový agent lze přidat jedním adresářem bez změny jádra (ověřeno testovacím „hello" agentem).
- Agent nemůže zavolat tool mimo svou definici ani mimo scope SVJ (test).

### Fáze 2 – Provoz

- Revize: `inspection-planner`, `inspection-report-reader`, `quote-evaluator`; poptávky dodavatelů.
- Úkoly vzniklé z fáze 1 (`needs_review`, konflikt, selhání agenta) – tabulka `task`, subscribery na `finance.invoice.needs_review`, `finance.sync.conflict`, `agent.run.failed` zakládají úkol pro odpovědné oddělení místo tichého stavu bez další akce.
- Terén: PWA hlášení, `field-dispatcher`; oddělení a úkoly.
- Vozový park: `fleet-manager`.
- UI: kalendář revizí, úkoly per oddělení, technik mobil.

**Akceptační kritéria:** revize 30 dní před termínem spustí poptávku ke schválení; nahraná revizní zpráva vytvoří závady a úkoly; hlasové hlášení technika se rozpadne na úkoly pro správná oddělení.

### Fáze 3 – Vlastníci a komunikace

- `cadastre-watcher`, `contact-curator`, katastrální mock adapter.
- `owner-support` nad KB (chunkování dokumentů, embeddingy, `knowledge_entry`).
- `debt-collector`, upomínky.

**Akceptační kritéria:** změna v mock katastru spustí proces převodu jednotky včetně kontroly dluhu; dotaz vlastníka „kolik dlužím a kdy bude revize výtahu" je zodpovězen z dat správně; upomínky jsou navrženy jen pro dlužníky nad práh a čekají na schválení.

### Fáze 4 – Governance, přehledy, MCP tokeny

- `assembly-assistant`, `monthly-reporter`, `copilot`.
- MCP server + správa API tokenů v UI (výběr toolů, rozsah SVJ, expirace, revokace).
- Dashboard správcovské firmy (cross-SVJ).

**Akceptační kritéria:** cross-SVJ dotaz přes copilota i přes MCP vrátí správný výsledek při respektování oprávnění; token s omezenou sadou toolů skutečně nevystaví nic dalšího (test); revokace tokenu je okamžitá; měsíční report je vygenerován a schválen; nahrávka shromáždění → zápis s usneseními.

### Fáze 5 – Uživatelsky definovaní agenti

- UI průvodce tvorby agenta (kap. 6.4), katalog událostí a toolů s popisy, sandbox/dry-run, verzování.
- Označení toolů `userComposable`, role `agent_author`.

**Akceptační kritéria:** uživatel bez zásahu vývojáře vytvoří agenta „při nahrání dokumentu typu smlouva vytvoř úkol pro finance s termínem konce výpovědní lhůty", otestuje ho v sandboxu a aktivuje; agent nemůže použít tool mimo oprávnění autora; každá změna vytvoří novou verzi s možností rollbacku.

### Fáze 6 – Demo polish

- Scénářový „demo režim" (tlačítka pro vyvolání událostí), reset dat, deployment do AWS, prezentace.

## 12. Rozhodnuté otázky

| Otázka                                       | Rozhodnutí                                                |
| -------------------------------------------- | --------------------------------------------------------- |
| ORM                                          | Drizzle + RLS přes `SET LOCAL`                            |
| Auth                                         | vlastní, NestJS + Passport                                |
| Hlasový přepis                               | Gemini (audio nativně)                                    |
| UI výboru                                    | UI i e-mailové schvalování                                |
| Název                                        | Domovník                                                  |
| Předpisy a saldo u vlastní správcovské firmy | nízká priorita, demo jede na `InternalReceivablesAdapter` |
