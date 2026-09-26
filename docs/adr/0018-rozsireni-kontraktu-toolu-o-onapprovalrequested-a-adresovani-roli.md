# 0018 – Rozšíření kontraktu toolu o onApprovalRequested a adresování rolí

- Status: Proposed
- Date: 2026-09-26
- Deciders: Ondra

## Context

Zadání kap. 6.2 a ADR 0006 popisují tool s `approval(ctx, input) → { required, approvers, deadline? }`,
ale `approvers` jsou konkrétní `user id` a `executeTool` po založení `Approval` nic feature neřekne.
Úkol 017 (`invoices`, commit e3e991c) potřeboval dvě věci, které kontrakt neměl: entita ve feature
se musí dozvědět, že čeká na schválení, dřív než `executeTool` vrátí `pending_approval` (jinak by
zůstala v předchozím stavu, dokud rozhodnutí nepřijde); a úkol 022 (`payments`, commit 7ed051a)
potřeboval adresovat approval roli („finance"), ne vyjmenovanému uživateli, protože agent v době
návrhu neví, kdo z výboru rozhodne.

## Decision

`ToolDefinition` (kernel) dostává volitelný hook `onApprovalRequested?(ctx, input, approvalId)`,
který `executeTool` zavolá bezprostředně po založení `Approval`, ještě před návratem
`{ status: 'pending_approval', approvalId }`. Handler toolu zůstává jediné místo, které entitu
mutuje po rozhodnutí (ADR 0006 platí beze změny) – `onApprovalRequested` smí jen poznamenat, že se
čeká, ne provést část akce. Kernel dostává `usersWithRole(ctx, role)`, takže `approvers` v politice
schvalování může být sestaveno z role tenantu/SVJ místo vyjmenovaných `user id`.

## Consequences

Rozšíření kontraktu, žádná změna chování existujících toolů (`onApprovalRequested` je volitelný).
Tool bez hooku se chová jako dřív. Toolům, které roli potřebují (`invoice.approve`, 017;
`payment.proposeMatch`, 022), odpadá nutnost dopočítávat approvery ručně mimo kernel. Testovat: tool
bez schválení nikdy nespustí handler (ADR 0006) a `onApprovalRequested` se zavolá právě jednou na
jedno vytvoření approvalu.

## Alternatives considered

Nechat feature naslouchat na vytvoření `Approval` přes event a reagovat asynchronně – zamítnuto,
protože stav entity by krátce po výzvě k akci vypadal nezměněný (`extracted` místo `pending_approval`)
a UI by ho ukázalo špatně, dokud by subscriber neproběhl. Adresovat approval jménem konkrétního
člověka vybraného agentem – zamítnuto, agent nezná složení výboru v čase návrhu a rotace lidí by
vyžadovala měnit prompt.

Commit: e3e991c (`onApprovalRequested`, úkol 017), 7ed051a (`usersWithRole`, úkol 022).
