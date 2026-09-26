# 053 – fleet: API, web, seed

## Navazuje na

- 052, 051 (mobilní shell `/t`).

## Vytvoří / upraví

- API: `GET /vehicles`, `GET /vehicles/:id`, `PATCH /vehicles/:id/assignee`, `POST /vehicle-deadlines/:id/complete`, `POST /vehicles/:id/trips` (`fleet.trips` – technik jen za vozidlo přiřazené jemu), `GET /vehicles/:id/trips`.
- `fleet/ui/`: `VehicleListScreen.tsx` (SPZ, model, přiřazení, nejbližší termín s barvou), `VehicleDetailScreen.tsx` (termíny, jízdy, tachometr), `CompleteDeadlineForm.client.tsx`, `TripForm.client.tsx` (v mobilním shellu technika jako `/t/trip` – „Zapsat jízdu" s předvyplněným vozidlem), `labels.ts`, `wire.ts`, `navigation.ts` („Vozový park" – manager; technik v `/t` spodní lišta položka „Jízda").
- `taskOriginLinks.vehicle_deadline` → detail vozidla.
- Seed `fleet/seed/`: druhý technik (zobecni `ensureChair` z `svj/seed/committee.ts` na `ensureUser(ctx, { email, displayName, roles })` v `packages/kernel/src/seed/` a `svj` přepni na něj; členství `technicians`, `maintenance`); 3 vozidla: Škoda Octavia Combi (STK za 20 dní, přiřazena technikovi 1), Dacia Dokker (povinné ručení propadlé před 3 dny – ukáže urgentní úkol), VW Caddy (vše v pořádku, přiřazena technikovi 2); ke každému 5 jízd za poslední měsíc s `svj_id` demo domů.
- E2E: scénář „Spustit ranní kontrolu termínů" (`daily_tick`) → úkoly k vozidlům v oddělení Správa → manager dokončí STK s dalším termínem → úkol `done`.

## Akceptační kritéria

`pnpm build`, e2e zelené, seed idempotentní.

## Stav po dokončení

Interní provoz správcovské firmy má vozový park.
