# 0005 – Pohoda je zdroj pravdy účetnictví; oddělené `AccountingAdapter` a `ReceivablesAdapter`

- Status: Accepted
- Date: 2026-09-09

## Context

Správcovské firmy mají zavedené účetnictví (Pohoda). Pohoda nemá SVJ modul; předpisy a saldo vlastníků vedou firmy různě.

## Decision

Domovník nevede vlastní účetnictví. `AccountingAdapter` (Pohoda mServer XML): přijaté faktury po schválení, likvidace, adresář, bankovní výpisy, skutečnost k rozpočtu. `ReceivablesAdapter` samostatně: `Internal` (výchozí v demu), `PohodaOtherReceivables`, později další systémy. Volba per SVJ. Demo používá mock adaptery se stejným XML schématem; contract testy sdílí mock i reálná implementace. XML se ověřuje na POHODA Start před fází 1.

## Consequences

Stav faktury má krok `posted` s `pohoda_id`. Sync detekuje konflikty (`sync_conflict`) místo tichého přepisu. V produkci potřebuje konektor u zákazníka (Windows) – mimo rozsah dema.
