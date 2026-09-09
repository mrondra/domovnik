# 0003 – Multi-tenancy přes Postgres RLS s povinným `withTenant` wrapperem

- Status: Accepted
- Date: 2026-09-09

## Context

Správcovská firma (tenant) → N SVJ. Agenti i tokeny musí být striktně scopované. Aplikační `WHERE tenant_id = ?` v každém dotazu je křehké, zvlášť u kódu psaného agentem.

## Decision

RLS na každé tabulce s `tenant_id` (policy generuje `tenantTable()` helper). Kontext se nastavuje `SET LOCAL app.tenant_id / app.actor_id` v transakci. Kernel exportuje pouze `withTenant(ctx, fn)`; přímý Drizzle klient není exportován. Platí pro API, workers i MCP. Každá nová tabulka má integrační test izolace.

## Consequences

Každý DB přístup je v transakci. Connection pooler (pokud přijde) musí být v session/transaction módu kompatibilním se `SET LOCAL`. Cross-tenant operace (reporty správcovské firmy) jsou explicitní `withTenant` s rolí tenant-admin, nikdy „bez tenantu".

## Alternatives considered

Aplikační filtry – zavrženo (jedno zapomenutí = únik). Schema-per-tenant – zavrženo (migrace × N, agenti pracují cross-SVJ).
