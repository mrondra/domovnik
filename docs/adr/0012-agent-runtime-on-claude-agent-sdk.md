# 0012 – Agent runtime běží na Claude Agent SDK v izolovaném pracovním adresáři

- Status: Accepted
- Date: 2026-09-10
- Deciders: Ondra

## Context

`docs/engineering.md` §1 určuje pro agenty Anthropic Agent SDK. Úkol 001 žádal ověřit, že SDK umí přijmout tooly z našeho registru, a jinak se zastavit a navrhnout.

Ověřeno na `@anthropic-ai/claude-agent-sdk` 0.3.267: vlastní tooly jdou předat přes `tool(name, description, zodShape, handler)` → `createSdkMcpServer()` → `query({ options: { mcpServers, allowedTools } })`, vestavěné tooly (Read, Bash, …) se vypnou `tools: []`. Registr tedy sedí. SDK ale **vždy spouští subprocess** s přibalenou binárkou Claude Code; in-process režim neexistuje. Sonda ukázala dva důsledky, které se z dokumentace nepoznají:

1. Harness čte `CLAUDE.md`, uživatelskou paměť a systémové připomínky z `cwd`. S výchozím `cwd` by běh agenta jednoho tenanta viděl obsah disku serveru.
2. Kromě vlastního tahu posílá harness ještě vlastní pomocná volání (pojmenování session) a chybějící odpověď opakuje. Přehrávání fixtur podle pořadí požadavků by se proto rozešlo.

## Decision

Agent runtime v kernelu staví na `@anthropic-ai/claude-agent-sdk`. Ke každému běhu:

- se vytvoří prázdný dočasný `cwd`, který se po běhu smaže,
- `tools: []` a `settingSources: []` odříznou vestavěné tooly i nastavení z disku,
- `allowedTools` obsahuje jen tooly z definice agenta (název `entita.akce` se na MCP hranici píše `entita_akce`),
- rozpočet tokenů se kontroluje po každé zprávě; překročení končí běh jako `failed_budget` a emituje `agent.run.failed`.

Testy běží v režimu replay: `replayLlm(fixturePath)` postaví lokální HTTP endpoint, na který `ANTHROPIC_BASE_URL` nasměruje subprocess. Fixtury se **párují podle obsahu požadavku**, ne podle pořadí.

## Consequences

- Jeden běh agenta = jeden proces. Souběžnost per agent a per tenant je proto limit procesů; drží ho fronta (`agentLimits()`, pg-boss v úkolu 005).
- Produkční image musí obsahovat přibalenou binárku Claude Code (optional dependency podle platformy).
- Replay test spouští skutečný subprocess a skutečný in-process MCP server, takže ověřuje i naši smyčku toolů – ale je pomalejší než mock a je citlivý na změnu chování harnessu mezi verzemi SDK. Verzi SDK proto pinujeme.
- Langfuse trace má rozlišení zpráv SDK, ne jednotlivých HTTP volání.
- `packages/kernel/src/llm` a `packages/kernel/src/agents` jsou jediná místa, kde se smí importovat balíčky Anthropicu (vynuceno ESLintem i dependency-cruiserem).

## Alternatives considered

- Tool runner z `@anthropic-ai/sdk` (`client.beta.messages.toolRunner`) – běží v procesu, přesný rozpočet tokenů a přesný trace, ale je to odchylka od `docs/engineering.md` a bez subagentů z kap. 6.1 zadání.
- Mockovat `query()` v testech – jednodušší, ale test by přeskočil celou smyčku toolů, tedy právě to, co má ověřit.
