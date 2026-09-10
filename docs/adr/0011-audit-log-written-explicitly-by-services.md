# 0011 – Audit log zapisuje service explicitně, ne hook nad Drizzle

- Status: Accepted
- Date: 2026-09-10
- Deciders: Ondra

## Context

`docs/engineering.md` §5 říká, že `audit_log` plní kernel „automaticky přes `withTenant`, service jen dodá `reason`". Úkol 001 tuto volbu výslovně nechává na implementaci s tím, že odchylku je nutné zapsat jako ADR.

Automatický zápis by musel viset na hooku nad Drizzle. `reason` ale zná jenom volající service; hook by si ho musel brát z ambientního stavu (`AsyncLocalStorage`), který by service stejně musela naplnit před každou mutací. Tím zmizí jediná výhoda automatiky – že se na ni nedá zapomenout – a zůstane křehkost: hook nevidí `RETURNING`, dávkové inserty a `ON CONFLICT` stejně jako jednotlivé řádky, a u čtení navíc zbytečně zdržuje.

## Decision

`audit.record(ctx, { action, entity, entityId, reason, before, after })` volá service explicitně, uvnitř transakce otevřené `withTenant`. Volání mimo transakci je chyba (`audit_outside_transaction`), takže záznam auditu nemůže přežít rollback mutace.

## Consequences

- Každá mutující metoda service má v testu ověřený zápis auditu; „zapomenutý audit" chytá code review a test, ne runtime.
- Řádek auditu nese `actor`, `reason`, `correlationId` a `agentRunId` z kontextu, takže běh agenta je dohledatelný i z auditu, nejen z `agent_run`.
- Vylučujeme tím Drizzle hooky jako mechanismus pro cokoli dalšího – kdo chce vedlejší efekt u zápisu, napíše ho do service.
- `docs/engineering.md` §5 je tímto ADR upřesněn.

## Alternatives considered

Hook nad Drizzle uvnitř `withTenant` – zachytí i mutaci, na kterou se zapomene, ale `reason` stejně vyžaduje explicitní krok service a hook je citlivý na tvar dotazu.
