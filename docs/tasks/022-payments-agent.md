# 022 – payments: agent `payment-matcher` a tool `payment.proposeMatch`

Reference: ADR 0004, 0006; 017 jako vzor agenta s approval toolem.

## Navazuje na

- 021 (event `finance.transactions.unmatched` s reálným residuálem).

## Vytvoří / upraví

- `tools/list-unmatched.ts` (`payment.listUnmatched`: `{ svjId, transactionIds? }` → transakce s hinty; readOnly)
- `tools/candidates.ts` (`payment.candidates`: `{ transactionId }` → deterministicky spočítané kandidáty: předpisy s VS v Levenshtein ≤ 1, jednotky se saldem = |částka|, sdružené platby = součet 2–3 po sobě jdoucích předpisů; faktury s částkou ±1 Kč; readOnly). **Kandidáty počítá kód**, agent jen vybírá a zdůvodňuje.
- `tools/propose-match.ts` (`payment.proposeMatch`: `{ transactionId, targetType, targetId, amount, reason }`; `approval: required=true, approvers = uživatelé s rolí finance v tenantu`; handler po schválení → `payment_match(method 'agent')`, `recordPayment`/`transition('paid')`, `match_status='matched'`, event `finance.payment.matched`); před rozhodnutím `match_status='proposed'` (přes `onApprovalRequested` z 017).
- `tools/ignore.ts` (`payment.markIgnored`: `{ transactionId, reason }` – např. poplatek banky; `proposal: true`, bez approval, `match_status='ignored'`)
- `agents/payment-matcher/agent.ts` (`triggers: [{ event: 'finance.transactions.unmatched' }]`, `scope: 'svj'`, `model: 'sonnet'`, `autonomy: 'propose'`, `roles: ['finance']`, tools výše + `receivables.unitBalance`), `prompt.md`, `README.md`.
- Testy: replay pro dávku 5 transakcí (překlep VS, sdružená platba, chybějící VS + částka odpovídá jedné jednotce, bankovní poplatek, výdaj bez faktury) → 3× `proposeMatch`, 1× `markIgnored`, 1× nic (výdaj bez faktury zůstane `unmatched` – agent nesmí hádat); approval test jako v 017.

## Akceptační kritéria

- Jeden běh agenta zpracuje celou dávku (ověř `agent_run` count = 1).
- Žádný `proposeMatch` bez kandidáta z `payment.candidates` (prompt to říká; test kontroluje, že navržené `targetId` bylo v kandidátech).

## Mimo rozsah

UI (023).

## Stav po dokončení

Residuál plateb má návrhy ve frontě finance.
