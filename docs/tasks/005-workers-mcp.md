# 005 – apps/workers a apps/mcp

Reference: ADR 0004, 0006, 0008; zadání kap. 5, 6, 9.

## Cíl

Workers: relay outboxu, doručování eventů subscriberům, plánovač, hostování agent runtime. MCP: server nad registrem toolů s token autentizací.

## Rozsah – workers

1. NestJS standalone app, `pg-boss` nad stejnou DB (vlastní schema `pgboss`).
2. Outbox relay: polling/NOTIFY → publikuje job per event; označí odeslané. At-least-once.
3. Dispatcher: pro event najde subscribery (feature handlery přes `events.subscribe`) a agenty (definice s odpovídajícím `triggers`), pro každého job s idempotency key `eventId:subscriber`. Agentní joby v queue s limitem souběžnosti dle definice/tenantu.
4. Scheduler: cron jobs z definic agentů (`schedule`) a z registrovaných tiků (`tick.daily`, `tick.monthly` jako eventy).
5. Approval resume: po `approval.decided(approved)` provede odložený handler toolu.
6. Health endpoint, graceful shutdown, metriky počtu jobů v logu.

## Rozsah – mcp

1. `@modelcontextprotocol/sdk` server, Streamable HTTP transport, autentizace `Authorization: Bearer <api token>` → `RequestContext`.
2. `tools/list` vrací jen tooly povolené v tokenu ∩ aktuální oprávnění uživatele; `tools/call` → `executeTool` (včetně approval flow: vrací `pending_approval` s ID a vysvětlením).
3. Resources: `approvals://inbox`, `svj://list` (až bude feature `svj`; zatím prázdné).
4. Každé volání → `audit_log` s `via: api_token:<id>`.

## Akceptační kritéria

- Integrační test: `events.emit` v transakci → job → subscriber handler zavolán přesně jednou i při dvojím doručení (idempotence).
- Agent s triggerem na event je spuštěn v replay režimu, `agent_run` má `trace_id`.
- Souběžnost: 10 eventů, limit 2 → nikdy víc než 2 běhy paralelně (test s umělým zpožděním).
- MCP: klientský test (SDK client) – token bez toolu X nevidí X v listu a call na X vrací chybu; call na tool s approval vrací `pending_approval`.
