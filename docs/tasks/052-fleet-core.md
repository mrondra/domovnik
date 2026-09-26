# 052 – fleet: schéma, service, hlídání termínů

Reference: zadání kap. 4 (vehicle, vehicle_event), 7 (`fleet-manager` – zde čistě kód).

## Navazuje na

- 031 (`createTask`), 028 (`daily_tick`).

## Vytvoří / upraví

`pnpm gen:feature fleet` (vše `tenantTable` – vozidla patří firmě):

- `vehicle`: `plate text` (unique per tenant), `label text`, `model text`, `year int NULL`, `vin text NULL`, `assigned_user_id uuid NULL`, `odometer_km int NOT NULL DEFAULT 0`, `status vehicle_status` (`active`, `in_service`, `retired`).
- `vehicle_deadline`: `vehicle_id`, `kind vehicle_deadline_kind` (`stk`, `liability_insurance`, `casco`, `service`, `vignette`), `due_on date NOT NULL`, `done_on date NULL`, `note text NULL`. Index `(tenant, due_on) WHERE done_on IS NULL`.
- `trip`: `vehicle_id`, `driver_id`, `trip_date date`, `start_km int`, `end_km int` (CHECK end ≥ start), `purpose text`, `svj_id uuid NULL`.
- Service: `listVehicles`, `getVehicle` (+ termíny + posledních 20 jízd), `assignVehicle(ctx, vehicleId, userId | null)`, `completeDeadline(ctx, deadlineId, { doneOn, nextDueOn? })` (vytvoří další termín téhož druhu, pokud `nextDueOn`; zavře úkol přes `closeTasksForOrigin`), `logTrip(ctx, input)` (aktualizuje `odometer_km` na max), `upcomingDeadlines(ctx, { withinDays })`.
- `subscribers/daily-deadlines.ts` (`tick.daily`): termíny do 30 dní → `createTask({ title: '<druh česky> – <SPZ>', departmentCode: 'administration', priority: ≤ 7 dní nebo po termínu ? 'high' : 'normal', dueOn: due_on, origin: { type: 'vehicle_deadline', id }, dedupeKey: 'vehicle_deadline:<id>' })`; po termínu a vozidlo `active` → druhý úkol `urgent` „Vozidlo <SPZ> nesmí vyjet – <druh> propadlé" (dedupe `…:overdue`). **Bez LLM.**
- Tooly (readOnly, userComposable, `fleet.read`): `fleet.listVehicles`, `fleet.upcomingDeadlines`.
- Oprávnění: `fleet.*` → manager; technician `fleet.read`, `fleet.trips`.
- Eventy: `fleet.deadline.completed`, `fleet.trip.logged`.
- `demo/reset.ts` (smaže jízdy a dokončení vzniklé po seedu – seed si drží stabilní klíče).

## Testy

RLS 3 tabulek; tik: termín za 20 dní → úkol `normal`, za 5 → `high`, propadlý u aktivního → 2 úkoly; druhý tik → nic nového; `completeDeadline` zavře úkol a založí další termín.

## Akceptační kritéria

`pnpm verify`.

## Stav po dokončení

Vozový park s termíny hlídanými kódem.
