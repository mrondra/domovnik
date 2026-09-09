# 0004 – Kód první, agent na residuál; agentní eventy jsou dávkové

- Status: Accepted
- Date: 2026-09-09

## Context

Event-driven architektura + LLM na každý event = latence, náklady, rate limity a nedeterminismus tam, kde není potřeba (párování VS, kontrola termínů).

## Decision

Service vrstva rozhoduje deterministicky vše, co jde. Pro nerozhodnuté případy emituje **agentní event** jako jednu dávku (`finance.transactions.unmatched` s N položkami). Agenti se přihlašují k agentním eventům; doménové eventy slouží auditu a integracím. Agent runtime má limity souběžnosti a rozpočet tokenů per běh.

## Consequences

Každý agent v katalogu má explicitně popsané, co je kód a co residuál. LLM nikdy neběží v cyklu nad položkami (lint pravidlo na `await` LLM v cyklu). Akceptační test: 200 pohybů, 195 jednoznačných → jeden běh agenta s 5 položkami.
