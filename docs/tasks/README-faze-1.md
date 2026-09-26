# Fáze 1 – faktura end-to-end (úkoly 009–026)

Cíl fáze (zadání kap. 11, fáze 1): faktura doručená e-mailem projde bez zásahu k `Approval` s evidencí,
schválení ji zapíše do (mock) Pohody a vytvoří příkaz k úhradě, import výpisu ji spáruje bez agenta,
residuál plateb řeší agent. Po 026 je demo předveditelné.

## Formát úkolů (reakce na zpětnou vazbu z 000–007)

Každý úkol má: **Navazuje na** (co musí existovat, konkrétní soubory), **Vytvoří / upraví** (seznam
souborů), **Rozhraní** (názvy tabulek, sloupců, eventů, toolů, signatury – ne „udělej service"),
**Testy**, **Akceptační kritéria**, **Mimo rozsah**, **Stav po dokončení** (vstup dalšího úkolu).
Úkol má odpovídat 1–3 hodinám práce. Když je delší, je to chyba zadání – zastav se a řekni to.

## Vzory z 000–007, které platí pro všechny úkoly

- Importy relativní, bez přípony, bez aliasů (ADR 0010): z feature do kernelu `../../../kernel/src/<module>/index`.
- Feature má dvoje dveře: `index.ts` (api/workers/mcp/jiné features) a `ui/index.ts` (apps/web) – ADR 0017. Oba jsou čisté barrely, složka s `index.ts` má `README.md`.
- Strop 100 řádků na soubor (`max-lines`). Rostoucí soubor → složka s `index.ts`.
- Audit zapisuje service explicitně `audit.record(ctx, …)` uvnitř `withTenant` (ADR 0011). Každá mutující metoda má test na audit.
- Tabulky přes `tenantTable()` / `svjTable()` z `packages/kernel/src/db/index`; RLS test na každou (vzor `packages/features/svj/tests/rls.int.test.ts`).
- Tooly ve `tools/*.ts` (plochý adresář, glob `packages/features/*/tools/*.ts`), agenti v `agents/<name>/agent.ts` + `prompt.md`.
- Event: `defineEvent(name, zodSchema)` v `domain/events.ts`; emit jen ze service uvnitř transakce.
- Approval: tool s `approval` vracejícím `required: true` → `executeTool` založí `Approval`; handler běží po rozhodnutí ve workers (ADR 0015). `approvers` jsou user id.
- `RequestContext.svjScope` (ADR 0016): každý seznam napříč SVJ ho respektuje – vzor `listForActor` v `packages/features/svj/service/summaries.ts`.
- API: controller v `api/`, zod schémata odpovědí v `api/<name>.schema.ts`, `requireContext()` z kernelu (vzor `packages/features/svj/api/svj.controller.ts`). Modul se registruje `pnpm api:modules`.
- Web: screen v `features/<name>/ui/` nic nefetchuje; `apps/web/src/api/<name>.ts` čte přes `readApi`/`callApi` a stránka v `apps/web/src/app/s/[svjId]/<name>/page.tsx` data předá (vzor `apps/web/src/api/svj.ts`). Navigace přes `ui/navigation.ts` + `pnpm` compose-navigation.
- Seed: `seed/<name>.seed.ts` s `defineSeed`, idempotentní podle stabilního klíče (vzor `packages/features/svj/seed/svj.seed.ts`).
- LLM: jen přes `packages/kernel/src/llm` (`extract`, `classify`, `complete`); testy v replay režimu s fixturami párovanými podle obsahu (ADR 0012).
- Češtinu v UI textech, docs a promptech; angličtinu v kódu a README u kódu.

## Pořadí

| #   | Úkol                                                                              | Navazuje na   |
| --- | --------------------------------------------------------------------------------- | ------------- |
| 009 | kernel + workers: feature subscribers                                             | 001, 005      |
| 010 | kernel: storage (S3/MinIO)                                                        | 001           |
| 011 | documents: schema + service + tool                                                | 010           |
| 012 | receivables: schema + `ReceivablesAdapter` + `Internal` adapter                   | 007           |
| 013 | receivables: tooly, API, seed předpisů                                            | 012           |
| 014 | invoices: schema (supplier, contract, budget_line, invoice) + service jádro       | 007, 011      |
| 015 | invoices: příjem faktury (inbound mail adapter, simulace)                         | 014           |
| 016 | invoices: extrakce (Haiku) + deterministické kontroly                             | 015           |
| 017 | invoices: tool `invoice.approve` s approval + agent `invoice-processor`           | 016           |
| 018 | invoices: API + web (seznam, detail s evidencí)                                   | 017           |
| 019 | invoices: seed (dodavatelé, smlouvy, rozpočet, PDF fixtury) + demo tlačítko       | 018           |
| 020 | payments: schema + deterministické párování                                       | 013, 014      |
| 021 | payments: `BankAdapter` + syntetický generátor + import                           | 020           |
| 022 | payments: agent `payment-matcher` + tool `payment.proposeMatch`                   | 021           |
| 023 | payments + receivables: API + web (platby, saldo, nespárované)                    | 022           |
| 024 | accounting-sync: `AccountingAdapter` + `PohodaMockAdapter` + contract testy       | 014           |
| 025 | accounting-sync: subscribery (posting, likvidace), sync_conflict, agent guard, UI | 024, 009, 023 |
| 026 | fáze 1 end-to-end: demo scénář, Playwright, akceptace fáze                        | vše           |

## Stav po 026

Fáze 1 je hotová a předvedete ji podle `docs/demo-scenar.md`. Celý řetězec — faktura e-mailem →
přečtení → návrh agenta → schválení výborem → zápis do (mock) Pohody → výpis → likvidace → rozdíl
proti Pohodě — projíždí `apps/web/e2e/phase1.e2e.ts` při každém `pnpm test:e2e`, offline.

### Akceptační kritéria fáze 1 (zadání kap. 11) → čím jsou doložená

| Kritérium                                                                   | Kde se to ověřuje                                                                                                                                           |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Doručení faktury vede bez zásahu k `Approval` s údaji, smlouvou a rozpočtem | `features/invoices/tests/extraction.int.test.ts`, `invoice-processor.agent.int.test.ts`, `apps/web/e2e/phase1.e2e.ts` (kroky 1–3)                           |
| Schválení zapíše fakturu do (mock) Pohody                                   | `features/accounting-sync/tests/posting.int.test.ts`, e2e krok 4                                                                                            |
| Import odpovídající transakce fakturu zlikviduje **bez agenta**             | `features/payments/tests/expense.int.test.ts` (párování pravidlem), `features/accounting-sync/tests/liquidate.int.test.ts` (likvidace), e2e krok 5          |
| Import výpisu spustí **právě jeden** běh `payment-matcher` nad residuálem   | `features/payments/tests/import.int.test.ts` („asks about the rest exactly once"), `payment-matcher.agent.int.test.ts` („reads the whole batch in one run") |
| `withTenant`: dotaz mimo wrapper vyhodí výjimku, cizí tenant nic nevidí     | `kernel/src/db/tenant.int.test.ts`, `rls.int.test.ts` každé feature                                                                                         |
| Změna faktury přímo v Pohodě je konflikt                                    | `features/accounting-sync/tests/conflicts.int.test.ts`, `guard.agent.int.test.ts`, e2e krok 7                                                               |
| Každý krok dohledatelný v `agent_run`; audit má actora a důvod              | `kernel/src/agents/runtime/runtime.int.test.ts`, audit testy jednotlivých features                                                                          |
| Nový agent = jeden adresář bez změny jádra                                  | `kernel/src/agents/definition.test.ts` + tři agenti (`invoice-processor`, `payment-matcher`, `accounting-sync-guard`) přidaní právě takhle                  |
| Agent nesmí zavolat tool mimo svou definici ani mimo scope SVJ              | `kernel/src/tools/execute.int.test.ts`, `kernel/src/identity/svj-access.int.test.ts`, `kernel/src/agents/runtime/limits.int.test.ts`                        |

### Co zůstalo otevřené pro fázi 2

- **Příkaz k úhradě.** Zadání kap. 11 ho čeká po schválení faktury; fáze 1 fakturu zapíše do Pohody
  a čeká na výpis. Platební příkaz (formát, podpis, banka) nemá ADR ani úkol.
- **Úkoly.** Konflikt i návrh agenta dnes končí jako `Approval`. Úkoly (`task`) přijdou ve fázi 2 a
  teprve ony jsou to, co zadání u konfliktu popisuje.
- **Ověření XML na POHODA Start.** Předpoklad z kap. 8 a ADR 0005 nebyl splněn; `mserver` adapter
  proto existuje jen jako klient a `adapters/resolve.ts` přes něj odmítne SVJ obsloužit. Co přesně
  je neověřené, je vypsané v `features/accounting-sync/adapters/pohoda/xml/README.md`.
- **`ReceivablesAdapter` pro Pohodu.** Fáze 1 má `internal`; `pohoda_other_receivables` je v enumu
  a nemá implementaci.
- **Langfuse.** Tracing je zapojený, ale žádný test neověřuje, co do něj doteče — bez klíčů se jen
  tiše vypne.
- **Řady, předkontace a členění DPH v Pohodě.** Mock je respektuje tvarem dokladu, hodnoty jsou
  konstanty z configu; reálná instalace bude mít vlastní.

### Odchylky a rozhodnutí, která nejsou v ADR

| Co                                                                   | Proč                                                                                                                | ADR                                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `onApprovalRequested` v definici toolu (kernel, 017)                 | feature si potřebuje poznamenat, že její entita čeká na schválení, dřív než `executeTool` vrátí `pending_approval`  | [0018](../adr/0018-rozsireni-kontraktu-toolu-o-onapprovalrequested-a-adresovani-roli.md) |
| `usersWithRole` v kernelu (022)                                      | approval se adresuje roli („finance"), ne konkrétnímu člověku                                                       | [0018](../adr/0018-rozsireni-kontraktu-toolu-o-onapprovalrequested-a-adresovani-roli.md) |
| `orderSeedModules` přesunuté z `packages/db` do kernelu (026)        | pořadí podle `dependsOn` čte i reset dema a testy; `dependsOn` je pole kernelového `SeedModule`                     | [0020](../adr/0020-poradi-seedu-v-kernelu-a-semantika-resetu-dema.md)                    |
| `finance.payment.matched` verze 2 (`amount`, `bookedOn`)             | `accounting-sync` nesmí číst tabulky plateb, jen události; starší událost subscriber přeskočí                       | [0019](../adr/0019-verzovani-domenovych-udalosti.md)                                     |
| Reset dema nesází seed znovu                                         | maže jen to, co ukázka vyrobila, takže není co sázet — a feature nesmí sáhnout do `packages/db`, kde seed runner je | [0020](../adr/0020-poradi-seedu-v-kernelu-a-semantika-resetu-dema.md)                    |
| Uzavření konfliktu zapisuje rozhodnutí, ne novou hodnotu do faktury  | do Pohody se nepíše (ADR 0005) a `transition` neumí krok na stejný stav; opravu naší kopie dělá člověk              | [0021](../adr/0021-rozhodnuti-konfliktu-s-pohodou-se-nezapisuje-zpet.md)                 |
| E2E nahrazuje model lokálním stubem (`apps/web/e2e/agent-replay.ts`) | nahrané fixtury jsou z testovacího světa, ne ze seedu; `pnpm test:e2e` má běžet bez sítě a bez účtu                 | [0022](../adr/0022-e2e-testy-bez-modelu-lokalni-stub.md)                                 |
