# AGENTS.md – Domovník

Tento soubor je jediný zdroj pravidel pro AI coding agenty (Codex, Claude Code) i lidi.
`CLAUDE.md` pouze odkazuje sem. Detailní konvence: `docs/engineering.md`. Rozhodnutí: `docs/adr/`.
Zadání produktu: `docs/zadani.md`.

## 0. Pravidlo číslo jedna: neodchyluj se, ptej se

- Zadání (`docs/zadani.md`), ADR (`docs/adr/`) a tento soubor jsou závazné. **Nikdy se od nich neodchyluj bez schválení.**
- Když narazíš na důvod, proč něco nejde udělat tak, jak je rozhodnuto: **zastav se**, popiš problém, navrhni 1–3 řešení s dopady a **čekej na schválení**. Neimplementuj „prozatímní" variantu.
- Schválená změna rozhodnutí se nejdřív zapíše jako nové ADR (nebo `Superseded` u starého), teprve pak se implementuje.
- Nerozšiřuj rozsah úkolu. Když při práci objevíš další problém, zapiš ho do výstupu úkolu, neřeš ho.
- Když si nejsi jistý, co úkol znamená, ptej se před implementací, ne po ní.

## 1. Co je Domovník

AI-native platforma pro správcovské firmy spravující SVJ. Pohoda je zdroj pravdy pro účetnictví; Domovník je procesní a agentní vrstva nad ním. Agenti jsou uživatelé systému s auditem; akce s dopadem končí jako `Approval`. Princip „kód první, agent na zbytek".

## 2. Struktura

```
apps/web (Next.js) · apps/api (NestJS) · apps/workers (NestJS standalone) · apps/mcp
packages/kernel · packages/shared · packages/db · packages/features/<feature>
```

Kostra feature (generuje `pnpm gen:feature <name>`):

```
index.ts  schema.ts  domain/  service/  tools/  agents/  api/  ui/  adapters/  seed/  tests/
```

Hranice (vynucené `eslint-plugin-boundaries` + `dependency-cruiser`):

- feature importuje z jiné feature jen přes `index.ts`
- **`index.ts` je jen re-export** – žádná logika, žádné definice; ty patří do souboru vedle
- **složka s `index.ts` má `README.md`** (anglicky) – k čemu je, co který soubor dělá, jaké pravidlo v ní platí
- `kernel` nezná žádnou feature; `shared` nezná nic
- `apps/*` jsou jen bootstrap/composition, žádná business logika
- cykly mezi features jsou chyba buildu

## 3. Příkazy

```
pnpm install
pnpm dev                 # docker compose up + všechny appky
pnpm verify              # lint + typecheck + depcruise + knip + test  ← PŘED KAŽDÝM „HOTOVO"
pnpm test                # vitest, unit + integration (testcontainers Postgres)
pnpm test:evals          # evaly agentů s reálným LLM – jen na vyžádání
pnpm gen:feature <name>  # kostra feature
pnpm gen:agent <feature> <name>
pnpm gen:tool <feature> <name>
pnpm db:migrate | db:generate | db:seed
pnpm api:modules          # přegeneruje seznam feature modulů pro apps/api
pnpm adr:new "<title>"
```

Úkol není hotový, dokud `pnpm verify` neprojde. Nikdy neobcházej selhání pomocí `eslint-disable`, `@ts-ignore`, `.skip`, `.only`, `any` nebo snížením prahu coverage – lint to zachytí a je to důvod k zastavení a dotazu.

## 4. Jak se tu píše kód (zkráceně, detail v docs/engineering.md)

- TypeScript strict, žádné `any`, branded ID typy (`TenantId`, `SvjId`, …).
- Zod na každé hranici: API vstup, tool vstup/výstup, eventy, env.
- Mutace dat jen v `service/`; controllery, tooly a agenti volají service. Service emituje eventy.
- Veškerý DB přístup přes `withTenant(ctx, fn)` z kernelu. Nic jiného není exportováno.
- Deterministicky vše, co jde. Agent dostává jen residuál, eventy pro agenty jsou dávkové.
- Tool s `approval.required` nikdy neprovede handler přímo – ověř testem.
- Chyby přes taxonomii z kernelu (`DomainError`, `NotFoundError`, `ForbiddenError`, `AdapterError`). Nikdy `throw new Error("...")`.
- Logování jen přes `logger` z kernelu (pino), vždy s kontextem. Žádné `console.*`.
- Event handlery idempotentní podle `eventId`.
- Malé funkce, jedna odpovědnost, pojmenování říká „co", ne „jak". Žádné boolean parametry, žádné komentáře vysvětlující špatný kód – oprav kód.
- **Malé soubory: strop je 100 řádků** (`max-lines`, bez prázdných řádků a komentářů). Když soubor roste, není odpovědí větší strop, ale složka s `index.ts` a soubory podle odpovědnosti (`agents/runtime/`, `identity/service/`).
- Čeština v UI textech, doménových názvech, které vidí uživatel, a v `docs/` (včetně ADR); angličtina v kódu, komentářích, `README.md` u kódu, identifikátorech a commitech.

## 5. Testy

- Každá nová logika má test. Service: unit. DB/RLS/migrace: integrační nad reálným Postgresem. Adaptery: contract testy sdílené mezi mockem a reálnou implementací. Agenti: tooly mockované, LLM record/replay; evaly zvlášť.
- Test popisuje chování, ne implementaci (`it("rejects invoice duplicate by supplier+number+amount")`).
- Bez testu na RLS izolaci se nová tabulka nemerguje.

## 6. Definition of Done

- [ ] Rozsah odpovídá úkolu, nic navíc
- [ ] `pnpm verify` prošel lokálně
- [ ] Nová logika má testy, včetně negativních případů
- [ ] Nová tabulka: RLS policy + test izolace + migrace + seed
- [ ] Nový tool/agent: registrován konvencí (žádný ruční import), má test, u toolu je vyplněna `approval` politika
- [ ] Veřejný API feature (`index.ts`) obsahuje jen to, co ostatní opravdu potřebují
- [ ] Žádná změna rozhodnutí z ADR/zadání; pokud byla nutná, existuje schválené ADR
- [ ] Commit: conventional commits, jeden logický celek

## 7. Co nikdy nedělat

- Neměnit `kernel` kvůli potřebě jedné feature bez ADR.
- Nepřidávat závislost bez zdůvodnění v PR/commitu; žádné hostované služby navíc.
- Nevolat LLM v cyklu nad položkami.
- Neukládat secrets, tokeny, reálná osobní data. Seed je anonymizovaný.
- Nedělat destruktivní migrace bez ADR.
- Nesahat do `docs/adr/*` se statusem `Accepted` jinak než přidáním `Superseded by`.
