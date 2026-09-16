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
