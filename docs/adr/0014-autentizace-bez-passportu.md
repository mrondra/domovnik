# 0014 – Autentizace bez Passportu

- Status: Accepted
- Date: 2026-09-12
- Deciders: Ondra
- Supersedes: 0007 (část o Passportu)

## Context

ADR 0007 rozhodlo „Auth: NestJS + Passport, session cookie (web), API tokeny (MCP/REST), podepsané
jednorázové odkazy". Úkol 001 mezitím postavil celou autentizaci v kernelu: `authenticate`
(argon2 + rozřešení tenanta), `createSession`/`verifySession`/`revokeSession`, `createApiToken`/
`verifyApiToken`/`revokeApiToken` a `createSignedLink`/`verifySignedLink`. Všechny tři způsoby
ověření tedy už existují jako funkce, které vrací `AuthenticatedUser` nebo `ApiTokenGrant`.

Rozsah úkolu 004 popisuje HTTP vrstvu jako `RequestContextMiddleware` + guardy (`@Roles()`,
`@RequireSvjAccess()`), ne jako Passport strategie. Passport by v tomhle uspořádání byl prázdný
obal: `LocalStrategy.validate()` by zavolala `authenticate()`, `BearerStrategy.validate()` by
zavolala `verifyApiToken()` a nic dalšího by nepřidala. Navíc přináší dvě závislosti
(`passport`, `@nestjs/passport`) a druhé místo, kde je popsáno, co je identita.

## Decision

`apps/api` autentizuje vlastním `RequestContextMiddleware`, který volá přímo kernel. Passport se
nepoužívá a `passport` ani `@nestjs/passport` nejsou závislostí repa.

Výměnnost za Cognito, kvůli které 0007 Passport chtělo, drží hranice v kernelu: middleware zná jen
`authenticate`, `verifySession` a `verifyApiToken`. Výměna poskytovatele identity je změna
implementace těchto tří funkcí, ne změna HTTP vrstvy.

## Consequences

- Ověření je jeden middleware a jedna funkce na každý druh přihlašovacího údaje; není žádná
  strategie, `guard('local')`, `serializeUser` ani `req.user`.
- Kernel dostal `UnauthenticatedError` (HTTP 401). Do té doby vracely `verifySession`,
  `verifyApiToken`, `authenticate` i `verifySignedLink` `ForbiddenError`, což je 403 – jenže „nemám
  platný přihlašovací údaj" a „jsem přihlášený, ale nesmím to" jsou pro klienta různé situace.
- Podepsaný odkaz nese `tenantId` a `actorId`, jinak by z něj nešel sestavit `RequestContext`.
  Odkaz tedy patří konkrétnímu schvalovateli, což je i to, co chce zadání kap. 2 („odkaz opravňuje
  pouze k rozhodnutí o daném approval, k ničemu dalšímu").
- Vylučujeme tím Passport strategie i pro budoucí způsoby přihlášení. Nový způsob = nová funkce
  v `kernel/identity/service` a nová větev v rozpoznávání přihlašovacího údaje.

## Alternatives considered

- **Passport jako tenká obálka nad kernelem** – 0007 by zůstalo beze změny, ale přibyly by dvě
  závislosti a vrstva, která nic nerozhoduje; identita by byla popsaná na dvou místech.
- **Nechat nesoulad nezapsaný** – proti AGENTS.md §0; příští čtenář 0007 by hledal Passport, který
  v repu není.
