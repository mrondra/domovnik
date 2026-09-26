# 0021 – Rozhodnutí konfliktu s Pohodou se nezapisuje zpět

- Status: Proposed
- Date: 2026-09-26
- Deciders: Ondra

## Context

ADR 0005 dělá z Pohody zdroj pravdy účetnictví; `accounting-sync` (úkol 025, commit ccb9471) detekuje
`sync_conflict`, když se faktura v Pohodě liší od naší kopie (částka, splatnost, VS). Zadání ani ADR
0005 neřeší, co se stane s rozdílem po tom, co ho člověk „vyřeší" – faktura ve stavu automatu
(`domain/status.ts`) navíc nemá krok, který by ji vrátil na stejný stav, ze kterého vyšla
(`assertTransition` odmítá přechod na sebe sama).

## Decision

Uzavření konfliktu (`resolveConflict`) zapisuje **rozhodnutí** (`keep_ours` / `take_theirs` + `note`)
do `sync_conflict.resolution` a mění jeho stav na `resolved`. Nezapisuje žádnou novou hodnotu do
`invoice` ani do Pohody. Když rozhodnutí je „platí naše hodnota", opravu naší kopie (nebo v Pohodě)
provede člověk mimo tuhle transakci – tool ani service fakturu nemutuje.

## Consequences

`sync_conflict.resolved` neznamená „data jsou sjednocená", znamená „někdo o rozdílu rozhodl a je to
zaznamenané v auditu" (`accounting.conflict.resolved`). UI musí tohle rozlišení ukázat, ne prezentovat
`resolved` jako opravený stav. Nevzniká nová cesta zápisu do Pohody vedle `AccountingAdapter` (ADR
0005 zůstává jediné místo, které do Pohody píše) a `invoice` nepotřebuje nový přechod stavu jen kvůli
konfliktu.

## Alternatives considered

Provést opravu automaticky podle rozhodnutí (`take_theirs` → přepsat `invoice` hodnotami z Pohody) –
zamítnuto, `assertTransition` nemá krok zpět na stejný stav a ADR 0005 zakazuje zápis do Pohody mimo
schválení; automatický přepis by navíc mohl přepsat pole, která mezitím změnil jiný proces. Nechat
konflikt nerozhodnutý, dokud ho nevyřeší další sync – zamítnuto, konflikt je něco, co má vidět
člověk (zadání kap. 11, fáze 1 akceptační kritérium), tichý implicitní zánik by ho schoval.

Commit: ccb9471 (úkol 025).
