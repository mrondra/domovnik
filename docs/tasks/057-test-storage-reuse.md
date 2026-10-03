# 057 – testy: `startTestStorage` umí použít běžící MinIO

## Proč

Asymetrie v `packages/kernel/src/testing/`:

| harness                             | útěk z kontejneru                   | důsledek                   |
| ----------------------------------- | ----------------------------------- | -------------------------- |
| `startTestDb` (`database.ts:36-41`) | `process.env['DATABASE_URL']`       | běžící Postgres se použije |
| `startTestStorage` (`storage.ts`)   | **žádný** — vždy `GenericContainer` | kontejner je povinný       |

Komentář u `startCluster` to pro databázi říká naplno: _„A running Postgres from
docker compose or CI is reused; otherwise testcontainers starts one."_ U storage
to neplatí a je to jediný důvod, proč celá skupina testů nejde spustit tam, kde
Docker není dostupný.

Nejde o teoretickou nepříjemnost: `invoices/tests/world.fixture.ts`,
`documents/tests/documents.fixture.ts`, `demo/tests/demo.fixture.ts` a
`db/src/seed/seed.int.test.ts` na storage stojí, takže se jich to týká všech.

## Cíl

Když prostředí už nějaké S3 nabízí, `startTestStorage` ho **použije** místo
startování kontejneru — stejně jako to dělá `startTestDb` s databází. Když
nenabízí, chová se jako dnes.

CI už ty proměnné má (`verify.yml` ř. 50–53 a 85–88): `S3_ENDPOINT`,
`S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`. Lokálně běží MinIO
z `docker-compose.yml` na `localhost:9000` (`domovnik` / `domovnik123`).

## Na co pozor

**Izolace mezi testovacími soubory.** Dnes má každý soubor vlastní kontejner,
takže se o nic nedělí. `startTestDb` při znovupoužití clusteru řeší totéž tím,
že zakládá **vlastní databázi na každý testovací soubor**. Storage potřebuje
obdobu: vlastní bucket na soubor, který se po sobě uklidí. Fixní jméno bucketu
by znamenalo, že si dva paralelní soubory přepisují objekty — a protože vitest
běží ve víc workerech, projeví se to jako náhodné pády.

Jak to vyřešit je tvoje rozhodnutí; pojmenuj ho v `decisions.md`.

## Rozsah

- `packages/kernel/src/testing/storage.ts`
- `packages/kernel/src/testing/README.md` (tabulka a pravidlo složky)
- test na samotný harness, pokud to jde bez kontejneru

## Mimo rozsah

- změna `startTestDb` — ta útěk má a funguje
- `docker-compose.yml` a `verify.yml` — proměnné už existují, nic tam nepřidávej
- cokoli ve `features/` — tenhle úkol se dotýká jen testovacího harnessu

## Akceptační kritéria

`pnpm verify`, a navíc se musí dát integrační testy nad storage spustit
v prostředí s nastaveným `S3_ENDPOINT` **bez Dockeru**.

## Stav po dokončení

Harness umí obojí: sám si kontejner nastartovat, nebo použít ten, který už běží.
