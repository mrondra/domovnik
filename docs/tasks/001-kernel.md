# 001 – packages/kernel

Reference: ADR 0003, 0004, 0006, 0008; docs/engineering.md §5–9; zadání kap. 4 (Agentní vrstva), 6.

## Cíl

Jediná horizontální vrstva. Vše, co potřebuje každá feature: identita, kontext, DB s RLS, eventy, approvals, audit, registr toolů a agentů, agent runtime, LLM klient, chyby, logger, env, test helpery. Kernel nezná žádnou feature.

## Rozsah – moduly (`packages/kernel/src/<module>/`)

### `env`

Zod schéma všech env proměnných; `loadEnv()` selže s čitelnou chybou. Jediné místo, kde se čte `process.env`.

### `errors`

`DomainError`, `NotFoundError`, `ForbiddenError`, `ValidationError`, `AdapterError { retryable }`, `ConflictError`. Společný základ s `code`, `details`, `cause`. `isRetryable()`. Mapování na HTTP status a na tool-result tvar je zde (funkce), použití v api/runtime.

### `logger`

pino, `createLogger(bindings)`, child logger z kontextu. Redakce klíčů `password`, `token`, `authorization`, `email`, `phone`.

### `ids`

`brand<T>()`, typy `TenantId, SvjId, UserId, AgentId, AgentRunId, EventId, ApprovalId, ApiTokenId`, `newId()` (uuid v7), zod parsery pro každý.

### `context`

`RequestContext { tenantId, actor: { type: 'user'|'agent'|'system', id, roles }, correlationId, svjId? }`. `createContext()`, `withCorrelation()`. AsyncLocalStorage pro logger/audit.

### `db`

- Drizzle klient (jediné místo s importem `pg`/`drizzle-orm/node-postgres`, viz eslint výjimka).
- `withTenant(ctx, fn)`: otevře transakci, `SET LOCAL app.tenant_id`, `app.actor_id`, `app.actor_type`, poskytne `tx`; při chybě rollback. Vnořené volání se stejným ctx re-use transakce.
- `withSystem(fn)` pro migrace/seed/cross-tenant joby – vyžaduje explicitní `reason`, loguje warn.
- `tenantTable(name, columns)` helper: přidá `id`, `tenant_id`, `created_at`, `updated_at`, `created_by`, a metadata pro generování RLS policy (`FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid)`). `svjTable()` navíc `svj_id`.
- `rlsPoliciesSql(tables)` – generuje SQL pro migrace (použije `packages/db`).
- Kernel vlastní tabulky: `tenant`, `user`, `user_role`, `session`, `api_token`, `agent_identity`, `agent_definition`, `agent_config`, `agent_run`, `event`, `event_outbox`, `approval`, `audit_log`.

### `identity`

Tenant, user, role (`tenant_admin`, `manager`, `finance`, `technician`, `committee`, `owner`, `agent_author`), password hash (argon2), session (opaque token, expirace), API token (hash, allowed tools, svj scope, expiry, revoke), signed one-time links (`createSignedLink({ purpose, subjectId, expiresIn })`, `verifySignedLink`). Bez registrace a resetu hesla (ADR 0007).

### `events`

- `defineEvent(name, schema)` – typovaný event s verzí.
- `events.emit(ctx, event)` – zapisuje do `event` + `event_outbox` **uvnitř aktuální transakce**; volání mimo `withTenant` vyhodí chybu.
- `events.subscribe(name, handler, { idempotencyKey })` – pro workers; kernel poskytuje relay `outbox → pg-boss` a garantuje at-least-once + idempotenci podle `eventId`.
- Rozlišení doménový × agentní event jen konvencí názvu a dokumentací; runtime obě zpracuje stejně.

### `audit`

Automatický zápis do `audit_log` z `withTenant` pro insert/update/delete (hook nad Drizzle nebo explicitní `audit.record()` volané service – zvol jednodušší, zdokumentuj v ADR pokud se odchýlíš od „automaticky").

### `approvals`

`approvals.create(ctx, { toolName, input, evidence, approvers, deadline })`, `decide(ctx, id, decision, comment)`. Po `approved` runtime spustí odložený handler toolu. `Approval` má `status: pending|approved|rejected|expired`.

### `tools`

`defineTool()` dle engineering.md §6. Registr: `registerTool`, `getTools({ names, actor })` – filtruje podle oprávnění. `executeTool(ctx, name, input)`: validace zod, kontrola oprávnění, vyhodnocení `approval` → buď handler, nebo `approvals.create` a návrat `{ status: 'pending_approval', approvalId }`. Auto-discovery `features/*/tools/*.ts` je věc `packages/db`/apps – kernel poskytuje `loadToolsFrom(globs)`.

### `agents`

`defineAgent()` dle 6.1 zadání. Registr + `loadAgentsFrom(globs)`. Uložení do `agent_definition` (upsert podle name+version). Runtime:

- `runAgent(ctx, definition, trigger)` → vytvoří `agent_run`, sestaví kontext, spustí přes Anthropic Agent SDK s tool sadou z registru (jen `tools` z definice ∩ oprávnění agentní identity), zapíše výsledek, náklady, Langfuse trace.
- Limity: souběžnost per agent a per tenant (pg-boss), rozpočet tokenů (`failed_budget` + vytvoření úkolu je event `agent.run.failed`, kernel neví, co je úkol).
- Autonomie: `read` – runtime předá jen tooly bez side-effectů (`readOnly: true` v defineTool); `propose` – tooly, jejichž `approval` vrací required, nebo označené `proposal: true`; `act` – vše z definice.

### `llm`

Wrapper nad Anthropic SDK: `llm.complete`, `llm.extract(schema)`, `llm.classify(labels)`, výběr modelu podle aliasu (`sonnet`, `haiku`), tracing, record/replay (`LLM_MODE=replay` čte fixtures). Jediné místo importu `@anthropic-ai/sdk` / Agent SDK.

### `testing`

`startTestDb()` (testcontainers pgvector, migrace), `withTestTenant()`, `runAgentInTest()`, `replayLlm(fixturePath)`, `describeAdapterContract()`. Export z `@domovnik/kernel/testing` (ne z hlavního indexu; knip entry).

## Mimo rozsah

Feature tabulky, NestJS moduly, HTTP. Generátory (002). Skládání migrací (003).

## Akceptační kritéria

- `withTenant`: integrační test – dva tenanty, tabulka `approval`: čtení pod tenantem B vrací 0 řádků A, zápis s cizím `tenant_id` selže; volání `db` mimo wrapper vyhodí chybu (typově není možné, runtime test na interní klient).
- `events.emit` mimo transakci vyhodí chybu; uvnitř zapíše event i outbox atomicky (test s rollbackem).
- `executeTool` s `approval.required` **neprovede handler** a vrátí `pending_approval`; po `decide(approved)` handler proběhne právě jednou (test).
- Autonomie `read` nedostane tool se side-effectem (test).
- `runAgent` v replay režimu proběhne bez sítě, zapíše `agent_run` s tokeny z fixture.
- Coverage kernel ≥ 90 %.
- `pnpm verify` zelený. Report: rozhodnutí u auditu (hook × explicitní) a názvy balíčků SDK, které jsi použil, s verzemi.

## Pokyn

Anthropic Agent SDK: ověř aktuální název balíčku a API v dokumentaci; pokud SDK neumožňuje předat vlastní tooly způsobem, který registr potřebuje, **zastav se a navrhni** (např. tenká smyčka nad Messages API) – nerozhoduj sám.
