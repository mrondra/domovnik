# Demo scénář – deset minut

Krok za krokem pro živou ukázku fáze 1. U každého kroku je **co říct**, **co dělá kód** a **co dělá
AI** — ta hranice je to hlavní, co má divák z ukázky odnést.

## Než začnete

```bash
docker compose up -d
pnpm db:migrate && pnpm db:seed
pnpm dev                      # api, web a workers
```

Workers musí běžet: bez nich se faktura nepřečte, agent se neprobudí a do Pohody se nic nezapíše.
Extrakce faktury volá model, takže `ANTHROPIC_API_KEY` v `.env` musí být platný (`LLM_MODE=live`).

Přihlašovací údaje dema (heslo všude `domovnik-demo`):

| Kdo             | E-mail                               | Co v ukázce dělá                  |
| --------------- | ------------------------------------ | --------------------------------- |
| Alena Správcová | `tenant-admin@demo.domovnik.test`    | spouští scénáře na obrazovce Demo |
| Jana Kotlářová  | `vybor-kotlarska@demo.domovnik.test` | předsedkyně výboru, schvaluje     |
| Filip Účetní    | `finance@demo.domovnik.test`         | platby, saldo, účetnictví         |

Ukázka se celá odehrává na domě **Společenství vlastníků Kotlářská 14**.

## 0. Reset (30 s)

**Co říct:** „Začínáme z čistého stolu — domy, jednotky, předpisy, dodavatelé a smlouvy zůstávají,
mizí všechno, co vyrobila minulá ukázka."

Jako Alena → **Demo** → **Resetovat demo**. Obrazovka odpoví, kolik záznamů smazala.

**Kód:** každá feature říká, co z jejích dat vzniklo ukázkou (`demoReset`); `demo` nezná cizí
tabulky. **AI:** nic.

## 1. Faktura přijde e-mailem (1 min)

**Co říct:** „Dodavatel pošle fakturu na adresu SVJ. Nikdo ji nepřepisuje do systému."

Jako Alena → **Demo** → scénář _Běžná měsíční faktura za úklid_ → **Spustit**.

**Kód:** soubor se uloží do úložiště, vznikne `document` a `invoice` ve stavu `received`, emituje se
`finance.invoice.received`. Duplicita se pozná podle otisku souboru. **AI:** nic.

## 2. Platforma fakturu přečte a zkontroluje (1 min)

**Co říct:** „Přečíst PDF a zkontrolovat ho proti smlouvě a rozpočtu umí kód. Model jen převede
papír na pole."

Jako Filip → **Faktury** → faktura je `Přečtená`, v detailu jsou dodavatel, částka, splatnost,
smlouva a stav rozpočtu.

**Kód:** párování dodavatele podle IČO, smlouvy podle dodavatele a období, kontroly (duplicita,
odchylka od smlouvy, rozpočet). **AI:** jeden model (Haiku) přečte text faktury do polí — nic
nerozhoduje.

## 3. Agent sestaví návrh pro výbor (1 min)

**Co říct:** „Tady začíná agent. Dostane fakturu, o které kód rozhodl, že je v pořádku, a napíše
větu, kterou si přečte výbor. Schválit ji sám nemůže."

Jako Jana → **Schvalování** → položka `invoice.approve` → v detailu shrnutí, doporučení a rizika.

**Kód:** tool `invoice.approve` má politiku „vždy se ptej" a jeho handler se spustí až po
rozhodnutí. **AI:** agent `invoice-processor` přečte fakturu toolem `invoice.get` a napíše návrh.

## 4. Výbor schválí (1 min)

**Co říct:** „Rozhoduje člověk, jedním kliknutím, i z mobilu nebo z odkazu v e-mailu."

Jako Jana → **Schválit**. Faktura přejde na `Schválená`.

**Kód:** `Approval` se uzavře, handler toolu doběhne ve workers, emituje se
`finance.invoice.approved`. **AI:** nic.

## 5. Zápis do účetnictví (1 min)

**Co říct:** „Schválená faktura patří do účetnictví. Pohoda je zdroj pravdy, Domovník do ní zapisuje
a čte zpátky."

Jako Filip → **Faktury**: stav `Zaúčtovaná`. Pak dům → **Účetnictví**: účetní jednotka, poslední
výměny a mezi nimi _Zápis faktury_.

**Kód:** subscriber na `finance.invoice.approved` založí dodavatele v adresáři, pošle `dataPack` s
přijatou fakturou a uloží referenci, kterou Pohoda vrátila. **AI:** nic.

## 6. Výpis z banky a párování (2 min)

**Co říct:** „Výpis čteme přes účetnictví — banka už o pohybech Pohodě řekla. Co jde spárovat
pravidlem, spáruje pravidlo, ne model."

Jako Alena → **Demo** → _Načíst výpis za rok — Společenství vlastníků Kotlářská 14_ → **Spustit**.
Obrazovka řekne, kolik pohybů přišlo, kolik se spárovalo a kolik zbylo.

Jako Filip → dům → **Platby**: spárované úhrady; **Předpisy a saldo**: saldo a dlužníci.

**Kód:** párování podle variabilního symbolu a částky; úhrada faktury se v Pohodě zlikviduje.
**AI:** nic.

## 7. Zbytek dostane agent (1,5 min)

**Co říct:** „Zbyde hrstka pohybů, které pravidlo nerozhodne: překlep v symbolu, platba za dva
měsíce najednou, nedoplatek. Ty dostane agent — a zase jen navrhuje."

Jako Filip → dům → **Platby** → filtr **Nespárováno** → detail pohybu: kandidáti, které spočítal
kód, a návrh agenta čekající na schválení.

**Kód:** kandidáti (typo ve VS na jednu editaci, sedící saldo, dva měsíce dohromady). **AI:** agent
`payment-matcher` dostane celou dávku v jednom běhu a vybírá z kandidátů; výsledek je `Approval`
pro účetní.

## 8. Někdo změní fakturu přímo v Pohodě (1,5 min)

**Co říct:** „Účetní opraví částku přímo v Pohodě. Domovník to nepřepíše — ukáže rozdíl."

Jako Alena → **Demo** → _Účetní změnila částku faktury v Pohodě — Společenství vlastníků Kotlářská
14_ → **Spustit**.

Jako Filip → dům → **Účetnictví** → v **Rozdílech** řádek _Celková částka_ s oběma hodnotami vedle
sebe.

**Kód:** denní porovnání čte zaúčtované faktury zpátky z Pohody a rozdíl zapíše jako
`sync_conflict`; nic nepřepisuje. **AI:** agent `accounting-sync-guard` rozdíl popíše a navrhne, jak
ho uzavřít — rozhoduje účetní.

## Co říct na závěr (30 s)

- Model je v celém řetězci na dvou místech: přečíst papír a napsat návrh. Všechno ostatní je kód.
- Každý krok je dohledatelný: `audit_log` má actora a důvod, `agent_run` má běh agenta i jeho stopu.
- Agent nemá právo, které nemá tool, a tool s dopadem na peníze se vždy ptá člověka.

## Když se něco pokazí

| Co vidíte                    | Co s tím                                                                 |
| ---------------------------- | ------------------------------------------------------------------------ |
| Faktura zůstane `Přijatá`    | neběží workers, nebo `ANTHROPIC_API_KEY` není platný                     |
| Ve schvalování nic nepřibylo | agent ještě běží (pár desítek sekund), nebo skončil chybou v `agent_run` |
| `Zaúčtovaná` nepřijde        | SVJ nemá napojenou účetní jednotku — `accounting_link` chybí             |
| Výpis načte nula pohybů      | dům nemá bankovní účet nebo předpisy; pomůže `pnpm db:seed`              |

Celou tuhle sekvenci projíždí `apps/web/e2e/phase1.e2e.ts` při každém `pnpm test:e2e` — s modelem
nahrazeným lokální odpovědí, takže co je tady napsané, je i otestované.
