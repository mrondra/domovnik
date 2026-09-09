# 0006 – Schvalování je politika toolu, ne agenta

- Status: Accepted
- Date: 2026-09-09

## Context

Human-in-the-loop nesmí záviset na tom, zda agent „poslechne" prompt.

## Decision

`defineTool` má `approval(ctx, input) → { required, approvers, deadline? }`. Tool s `required: true` nikdy nespustí handler přímo; runtime vytvoří `Approval` a handler proběhne až po rozhodnutí. Autonomie agenta (`read/propose/act`) je horní limit, tool může být přísnější. Schvalování z e-mailu: odkaz vede na stránku (GET), rozhodnutí je POST.

## Consequences

Každý tool s `required` má povinný test, že handler bez schválení neproběhne. Prompty netvrdí omezení, která vynucuje runtime.
