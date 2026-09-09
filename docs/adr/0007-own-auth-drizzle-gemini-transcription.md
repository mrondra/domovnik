# 0007 – Vlastní auth, Drizzle ORM, Gemini pro přepis audia

- Status: Accepted
- Date: 2026-09-09

## Context

Rozhodnutí o technologiích pro demo; preference self-hosted stacku bez dalších hostovaných závislostí; OpenAI se nepoužívá.

## Decision

Auth: NestJS + Passport, session cookie (web), API tokeny (MCP/REST), podepsané jednorázové odkazy (schvalování). Bez registrace a resetu hesla v demu (uživatelé ze seedu). ORM: Drizzle (viz 0003). Přepis audia a embeddingy: Gemini přes adapter. Modely agentů: Anthropic Claude (Sonnet rozhodování, Haiku extrakce).

## Consequences

Auth je navržena tak, aby šla vyměnit za Cognito (rozhraní `AuthProvider`). Žádná další hostovaná služba se nepřidává bez ADR.

## Alternatives considered

Clerk/Supabase Auth – rychlejší, ale hostovaná závislost proti zbytku stacku.
