# @domovnik/web

The shell features mount their screens into: signing in, choosing an SVJ, the approvals inbox and
the page a signed e-mail link leads to. It holds no business logic and touches no database — every
read and every write goes through the API over HTTP, carrying the caller's own cookie.

| Directory / file    | Contents                                                                      |
| ------------------- | ----------------------------------------------------------------------------- |
| `src/app/`          | routes only; every page is a thin wrapper around a screen                     |
| `src/middleware.ts` | sends a visitor without a session cookie to `/login`                          |
| `src/api/`          | the API client and the shapes it parses answers into                          |
| `src/actions/`      | the server actions the client components call (`"use server"`)                |
| `src/shell/`        | the layout: sidebar, SVJ switcher, sign-out                                   |
| `src/navigation/`   | the kernel's own items plus `navigation.generated.ts`, composed from features |
| `src/approvals/`    | the inbox, the detail with its evidence, the decision form                    |
| `src/api-tokens/`   | the token checklist, the list and revocation (zadání kap. 9)                  |
| `src/auth/`         | the login form and its schema                                                 |
| `src/overview/`     | the landing screen of each scope                                              |
| `src/signed-link/`  | the screen `/a/[token]` renders                                               |
| `e2e/`              | Playwright, against a real API and a real Postgres                            |

## No class names here

Every screen is composed from `packages/shared/src/ui` — `Stack`, `Inline`, `Grid`, `Box`,
`Container`, `Heading`, `Text`, `Card`, `Table`, the form fields. Spacing is a prop naming a step on
the kit's scale, and vertical rhythm comes from the `gap` of the surrounding `Stack`, never from a
margin under one element and a padding over the next. Nothing in `src/` writes a Tailwind class; the
two exceptions are in `src/ui/`, where a link and a navigation item have to meet `next/link`, and
both take their look from the kit. If a screen needs something the kit does not offer, the missing
prop belongs in the kit.

## Two scopes, one shell

A screen is reached either inside one SVJ — `/s/[svjId]/…`, which sends `x-svj-id` on every API
call — or above them all, at `/…`, which only `manager` and `tenant_admin` may open. Both mount the
same `AppShell`, from `app/s/[svjId]/layout.tsx` and `app/(tenant)/layout.tsx` respectively, and the
only difference a page sees is whether `svjId` is a value or `null`.

The left-hand navigation is the kernel's three entries plus whatever the features register. A
feature that wants to appear there exports `navigation` from its `index.ts`, backed by
`ui/navigation.ts`; `pnpm web:navigation` re-composes `src/navigation/navigation.generated.ts` from
what is on disk, and a test fails if the committed file no longer matches. The list of SVJ behind
the switcher is served by the `svj` feature — where that feature is not installed the route does
not exist and the tenant has no SVJ, which is the same answer.

## Where the data comes from

`ui/` may not import a service (`depcruise` rule `ui-no-service`): the browser reaches the database
through the API or not at all. Reads happen in server components through `src/api/`, writes through
the server actions in `src/actions/`, so the session cookie stays `HttpOnly` and never crosses into
client JavaScript. The API's response shapes are restated as zod schemas here rather than imported —
one application must not reach into another's source (AGENTS.md §2) — and parsing every answer is
what keeps the two honest with each other.

Next compiles the kernel and the UI kit as ordinary sources of this application, because the imports
are relative paths (ADR 0010). `transpilePackages` is for packages resolved out of `node_modules`
and is deliberately not used.

## Running it

`pnpm dev` from the repository root starts it next to the API; on its own, `pnpm --filter
@domovnik/web dev` on port 3000, expecting the API at `API_URL` (default `http://localhost:3001`).

`pnpm test:e2e` runs Playwright. It needs the infrastructure from `docker compose` and the browsers
from `npx playwright install chromium`; the API and the web server it starts itself. It is not part
of `pnpm verify` — that would put a database, a production build and a browser into every run.

**The rule:** a page in `app/` is a wrapper and nothing else. Anything with a domain belongs in a
feature's `ui/`, and the page re-exports it (zadání kap. 3.1).
