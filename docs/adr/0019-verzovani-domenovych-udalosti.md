# 0019 – Verzování doménových událostí

- Status: Proposed
- Date: 2026-09-26
- Deciders: Ondra

## Context

Doménové eventy (zadání kap. 5) se zapisují do outboxu a subscribeři je zpracují i po redeployi;
outbox tedy může v okamžiku nasazení obsahovat eventy vzniklé starším tvarem `payload`. Úkol 026
(commit 8953066, fáze 1 end-to-end) na to narazil u `finance.payment.matched`: `accounting-sync`
potřeboval pro likvidaci platby vědět `amount` a `bookedOn`, což verze 1 (jen `transactionId`,
`targetType`, `targetId`) nenesla, a `accounting-sync` nesmí kvůli tomu číst tabulky `payments`
přímo (pravidlo „preferovaná vazba je událost", zadání 3.1 bod 2) – potřebuje si vystačit s eventem.

## Decision

`defineEvent(name, schema)` dostává třetí volitelný argument `{ version }` (výchozí 1). Změna tvaru
`payload` je vždy nová verze, ne úprava schématu na místě. Subscriber deklaruje, kterou verzi
zpracuje; když z outboxu přijde starší verze, subscriber ji přeskočí s `info` logem (ne `error` –
jde o očekávaný přechod, ne o poruchu) a nepokouší se ji dopočítat. `finance.payment.matched` verze 2
přidává `amount` a `bookedOn` právě proto, aby `accounting-sync` mohl likvidaci provést bez čtení
cizí tabulky.

## Consequences

Event v outboxu vzniklý před nasazením nové verze zůstane navždy ve verzi 1 – nedá se domyslet
zpětně, protože neřekl, kolik se zaplatilo. Subscriber na starou verzi „doběhne do prázdna" (přeskočí)
místo aby spadl, což znamená, že nasazení nové verze subscriberu nesmí čekat žádný efekt od eventů
vzniklých před ním. Emitující strana verzi nemění zpětně; kdo starou verzi potřebuje dál zpracovat,
dostane ji jako zvláštní migrační úkol, ne jako součást běžného nasazení.

## Alternatives considered

Migrace obsahu outboxu na novou verzi při nasazení – zamítnuto, outbox je log, ne stav, přepisovat
historii eventů maže auditní hodnotu. Zpětně kompatibilní schéma (nová pole `optional`) – zamítnuto
pro `finance.payment.matched`, protože `amount`/`bookedOn` jsou pro likvidaci povinné a `optional`
pole by jen přesunulo runtime chybu z deploye do zpracování.

Commit: 8953066 (úkol 026).
