# 040 – comms: odchozí pošta (simulovaná)

Reference: zadání kap. 8 (E-mail), rozhodnutí fáze 2: `comms` jen odchozí, příchozí sjednocení ve fázi 3.

## Navazuje na

- 027 (zadání v0.7 zmiňuje `comms`).

## Vytvoří / upraví

- Nové ADR (Accepted – schváleno tímto zadáním): „Odchozí pošta ve feature `comms`, simulovaný adapter". Decision: všechny odchozí e-maily jdou přes `sendMail`, v demu se neodesílají, ale ukládají a zobrazují; `InboundMailAdapter` v `invoices` zůstává do fáze 3.
- `pnpm gen:feature comms`:
  - `outbound_message` (`tenantTable`): `svj_id uuid NULL`, `to_address text NOT NULL`, `to_name text NULL`, `subject text`, `body_text text`, `status outbound_status` (`queued`, `sent`, `failed`), `adapter text`, `related_type text NULL`, `related_id uuid NULL`, `sent_at timestamptz NULL`, `error text NULL`, `dedupe_key text NULL` (unique partial).
  - `adapters/outbound-mail.adapter.ts`: `interface OutboundMailAdapter { kind: 'simulated' | 'smtp'; send(ctx, msg): Promise<{ providerId: string }> }`; `adapters/simulated.ts` (nic neposílá, vrátí `sim-<uuid>`); výběr podle env `OUTBOUND_MAIL_ADAPTER` (default `simulated`; `smtp` hodí `DomainError('not_implemented')`). Env do kernel schématu + `.env.example`.
  - Service: `sendMail(ctx, { svjId?, to: { address, name? }, subject, bodyText, related?: { type, id }, dedupeKey? }): Promise<OutboundMessage>` – insert `queued` → emit `comms.message.queued` → subscriber `comms.deliver` odešle adapterem a nastaví `sent`/`failed` (retry přes `AdapterError.retryable`). Odesílání mimo request = ADR 0015 princip.
  - `listOutbound(ctx, { svjId?, related? })`, `getOutbound(ctx, id)`.
  - Žádný tool (agenti poštu přímo neposílají; posílá handler toolu po schválení).
  - API: `GET /outbound?svjId=&relatedType=&relatedId=`, `GET /outbound/:id`.
  - UI: `OutboxScreen.tsx` („Odeslaná pošta" – tenant, manager/tenant_admin; v demu to je místo, kde divák uvidí, co by odešlo), detail zprávy.
  - `demo/reset.ts`.
- Oprávnění: `comms.read` pro manager (má `comms.*`), finance.

## Testy

RLS; `sendMail` → `sent` přes subscriber; `dedupeKey` idempotence; `failed` při chybě adapteru s `retryable=false`.

## Akceptační kritéria

`pnpm verify`; „Odeslaná pošta" v UI.

## Stav po dokončení

`sendMail` pro `quotes` (041, 044).
