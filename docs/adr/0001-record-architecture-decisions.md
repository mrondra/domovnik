# 0001 – Record architecture decisions

- Status: Accepted
- Date: 2026-09-09
- Deciders: Ondra

## Context

Repo bude z většiny psát AI coding agent. Bez explicitních, dohledatelných rozhodnutí se agenti tiše odchylují a rozhodnutí se ztrácí v konverzacích.

## Decision

Používáme ADR (MADR formát) v `docs/adr/`. Každé architektonické rozhodnutí je ADR. Přijaté ADR je závazné pro lidi i agenty. Odchylka bez schváleného ADR není povolena; agent, který narazí na důvod k odchylce, se zastaví a navrhne nové ADR ke schválení.

## Consequences

`AGENTS.md` odkazuje sem jako na závazný zdroj. `pnpm adr:new` generuje ze šablony. ADR se po přijetí needitují, jen nahrazují.
