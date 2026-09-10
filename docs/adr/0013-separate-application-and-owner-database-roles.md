# 0013 – Aplikace se k databázi připojuje rolí bez BYPASSRLS

- Status: Accepted
- Date: 2026-09-10
- Deciders: Ondra

## Context

ADR 0003 zavádí RLS a `withTenant`. Postgres ale RLS **nevynucuje** vůči superuživateli a ve výchozím stavu ani vůči vlastníkovi tabulky. Když se aplikace připojí rolí, která tabulky vlastní (typický `docker compose` i service container v CI), policy se neuplatní a izolační test projde, aniž by cokoli dokázal.

Zároveň `withSystem` (migrace, seed, relay outboxu) potřebuje cross-tenant přístup, který přes RLS nejde.

## Decision

Dvě připojení, dvě role:

- `DATABASE_URL` – aplikační role bez `BYPASSRLS`, která tabulky nevlastní. Používá ji `withTenant`, tedy veškerý běžný provoz.
- `DATABASE_ADMIN_URL` – vlastník schématu. Používají ho migrace, seed a `withSystem`. Když není nastavené, spadne se zpět na `DATABASE_URL`.

`rlsPoliciesSql()` generuje `ENABLE` i `FORCE ROW LEVEL SECURITY` a policy čte `current_setting('app.tenant_id')` bez `missing_ok`, takže dotaz mimo `withTenant` skončí chybou, ne prázdným výsledkem.

## Consequences

- `startTestDb()` zakládá pro každý testový soubor vlastní databázi i aplikační roli; izolační testy tedy měří skutečnou RLS.
- Nasazení musí obě role vytvořit; `DATABASE_ADMIN_URL` nepatří do prostředí, kde běží jen API.
- `withSystem` je jediná cesta k datům bez RLS a vyžaduje `reason`, který se loguje jako `warn`.

## Alternatives considered

- Jedna role s `BYPASSRLS` pro všechno – RLS by byla dekorace.
- Nechat aplikaci vlastnit tabulky a spolehnout se jen na `FORCE` – nechrání proti superuživateli a v CI je aplikační role často právě superuživatel.
