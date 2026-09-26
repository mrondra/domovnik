# 0022 – E2E testy bez modelu: lokální stub

- Status: Proposed
- Date: 2026-09-26
- Deciders: Ondra

## Context

`apps/web/e2e/phase1.e2e.ts` (úkol 026, commit 8953066) prohání celý řetězec faktury přes skutečný
agent runtime (workers, Agent SDK) offline a v CI, kde není síť ani účet u Anthropicu. Agenti
(`invoice-processor`, `payment-matcher`, `accounting-sync-guard`) volají model přes Agent SDK, který
očekává skutečné API. Nahrané fixtury z evalů (record/replay podle obsahu promptu, ADR 0012) jsou
svázané s konkrétním promptem a jeho zněním – e2e testuje průchod systémem, ne kvalitu promptu.

## Decision

`apps/web/e2e/agent-replay.ts` je lokální HTTP stub, který místo Anthropic API odpovídá tvarem, jaký
Agent SDK očekává (SSE `text/event-stream`), ale rozhoduje se čistě podle toho, co v požadavku je
(text faktury, seznam dostupných toolů) – volá stejné tooly (`mcp__domovnik__*`), jaké by zavolal
skutečný model pro standardní fakturu, takže `Approval`, který skončí v inboxu výboru, je založen
skutečným toolem, ne zmockovaný. Věty, které stub vrací jako text modelu, jsou kanonické, ne nahrané
z reálného běhu.

## Consequences

`pnpm test:e2e` běží offline a deterministicky, bez účtu a bez síťové závislosti na Anthropicu.
Stub nedokazuje kvalitu promptu ani že by skutečný model ve stejné situaci zavolal stejný tool se
stejným zdůvodněním – to je práce evalů (`pnpm test:evals`, AGENTS.md), které běží se skutečným LLM a
jsou samostatný, dražší a nedeterministický běh. Přidání nového kroku scénáře, který závisí na jiném
chování modelu (jiná faktura, jiný agent), znamená rozšířit stub o další rozhodovací větev, ne jen
přidat fixturu.

## Alternatives considered

Nahrané fixtury z reálných běhů (record/replay, jako u evalů) – zamítnuto, fixtura je svázaná se
zněním promptu v době nahrání a e2e by se rozbíjelo při každé úpravě promptu, i když se chování
systému nezměnilo. Mockovat přímo tooly/service místo modelu – zamítnuto, e2e má ověřit průchod přes
skutečný `executeTool`/`Approval`, ne obejít ho.

Commit: 8953066 (úkol 026).
