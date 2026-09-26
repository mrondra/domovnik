# 027 – ADR za odchylky fáze 1, aktualizace zadání

Reference: AGENTS.md §0, ADR 0001, `docs/tasks/README-faze-1.md` („Odchylky a rozhodnutí, která nejsou v ADR").

## Navazuje na

Fáze 1 dokončená; tabulka odchylek v `README-faze-1.md` má 7 řádků bez ADR.

## Cíl

Každé rozhodnutí, které mění kontrakt kernelu nebo chování mezi features, má ADR. Úkol je jen dokumentace – **žádná změna kódu**.

## Vytvoří / upraví

ADR (další volná čísla, `pnpm adr:new`, česky, status **Proposed** – Ondra je přepne na Accepted):

1. **Rozšíření kontraktu toolu o `onApprovalRequested` a approvers podle role** (`usersWithRole`). Proč, co to umožňuje, že handler toolu zůstává jediné místo mutace po schválení.
2. **Verzování doménových událostí.** Pravidlo: změna payloadu = `defineEvent` s novou verzí, subscriber deklaruje, kterou verzi zpracuje, starší přeskočí s `info` logem. Příklad `finance.payment.matched` v2. Co se stane s eventy v outboxu při nasazení.
3. **Pořadí seedů v kernelu a sémantika resetu dema.** `orderSeedModules` v kernelu, reset maže jen data vzniklá ukázkou a seed znovu nespouští. Uveď, že úkol 028 mění mechanismus registrace (ne sémantiku).
4. **Rozhodnutí konfliktu s Pohodou se nezapisuje zpět.** Uzavření konfliktu ukládá rozhodnutí; opravu naší kopie dělá člověk; navazuje na ADR 0005.
5. **E2E testy bez modelu: lokální stub.** `apps/web/e2e/agent-replay.ts`, proč ne nahrané fixtury, jaké jsou limity (stub nedokazuje kvalitu promptu – to dělají evaly).

Další soubory:

- `docs/tasks/README-faze-1.md` – tabulka odchylek: sloupec „ADR" s odkazem, žádný řádek bez odkazu.
- `AGENTS.md` §6 Definition of Done – nová položka: `- [ ] Každé rozhodnutí mimo zadání a ADR má ADR se statusem Proposed a je uvedené v reportu úkolu; tabulka „odchylky bez ADR" se nezakládá.`
- `docs/zadani.md` – verze 0.7: v kap. 3.1 seznam features doplň o `demo` (scénáře a reset ukázky), `suppliers` (dodavatelé a smlouvy, vyčleněno z invoices – fáze 2), `comms` (ve fázi 2 jen odchozí pošta); v kap. 7 katalog agentů doplň `quote-evaluator` (vyhodnocení nabídek, approval výboru); v kap. 11 fáze 2 doplň „úkoly vzniklé z fáze 1 (needs_review, konflikt, selhání agenta)". Řádek „Změny v 0.7" nahoře.

## Akceptační kritéria

- 5 ADR ve stavu Proposed, každé s Context/Decision/Consequences a odkazem na commit, kde rozhodnutí vzniklo.
- `pnpm verify` zelený (lint markdownu přes prettier).

## Mimo rozsah

Jakákoli změna kódu. Hodnocení, zda rozhodnutí byla správná – jen je zapsat.

## Stav po dokončení

Fáze 1 nemá nezdokumentovaná rozhodnutí; zadání v0.7 odpovídá repu.
