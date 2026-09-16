# 009 – Feature subscribers: discovery a hostování ve workers

Reference: ADR 0004 (eventy), 0015 (approval-resume jako vzor subscribera), `packages/kernel/src/events/subscribe.ts`, `apps/workers/src/runtime/registry.ts`, `apps/workers/src/runtime/start.ts`.

## Navazuje na

- `subscribe(name, handler, { subscriber, idempotencyKey?, concurrency? })` v kernelu existuje.
- Workers dnes natvrdo volají `subscribeApprovalResume()` a `subscribeAgents(runner)`; feature handler nemá, kde by se zaregistroval.

## Cíl

Feature může reagovat na event obyčejným handlerem (bez agenta) – souborem `subscribers/<name>.ts`, který se najde globem stejně jako tooly.

## Vytvoří / upraví

- `packages/kernel/src/discovery.ts` – přidej `loadSubscribersFrom(patterns)` (stejný `importAll`).
- `packages/kernel/src/events/index.ts` – re-export `loadSubscribersFrom`.
- `apps/workers/src/runtime/registry.ts` – konstanta `SUBSCRIBER_FILES = 'packages/features/*/subscribers/*.ts'`, načtení před `subscribeAgents`.
- `apps/workers/src/runtime/start.ts` – po načtení souborů předat všechny registrované subscriptions (`registeredSubscriptions()` – pokud v kernelu chybí, přidej vedle `subscribe`) do pg-boss stejným způsobem jako agentní.
- `tooling/generators/generate/subscriber.ts` + `tooling/generators/subscriber.ts` + šablona: `pnpm gen:subscriber <feature> <event-name> <subscriber-name>` vytvoří `subscribers/<subscriber-name>.ts` a `tests/<subscriber-name>.int.test.ts`. Root `package.json` skript `gen:subscriber`. Test generátoru podle `tooling/generators/tests/tool.test.ts`.
- `AGENTS.md` §3 – řádek s `gen:subscriber`; §2 kostra feature – doplň `subscribers/`.
- `docs/engineering.md` §11 – odstavec „Subscriber".

## Rozhraní

```ts
// packages/features/<f>/subscribers/<name>.ts
import { subscribe } from '../../../kernel/src/events/index';
export const onInvoiceApproved = subscribe(
  'finance.invoice.approved',
  async (ctx, event) => {
    /* volá service */
  },
  {
    subscriber: 'accounting-sync.post-invoice',
  },
);
```

Handler dostane `ctx` s `actor.type === 'system'`? **Ne** – běží v kontextu tenantu eventu s aktérem `{ type: 'system', id: 'subscriber:<name>' }`; ověř, jak to dělá `approval-resume`, a použij totéž. Idempotence: výchozí klíč `eventId:subscriber` (kernel už má).

## Testy

- `apps/workers/src/tests/subscriber-dispatch.int.test.ts`: fixture feature (dočasný soubor v `packages/features/__test__/subscribers/`, nebo mock globu – zvol podle toho, jak to dělá `agent-dispatch.int.test.ts`) → `events.emit` v transakci → handler zavolán právě jednou i při dvojím doručení.
- Generátor: vytvořený soubor projde `pnpm verify` v testovacím repu.

## Akceptační kritéria

- Nový subscriber = nový soubor, žádný ruční import (ověř `git grep` na název subscribera mimo jeho soubor a test).
- `pnpm verify` zelený.

## Mimo rozsah

Jakýkoli konkrétní subscriber feature (přijde v 025).

## Stav po dokončení

`packages/features/*/subscribers/*.ts` jsou hostované ve workers; existuje `pnpm gen:subscriber`.
