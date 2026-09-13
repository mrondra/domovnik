# @domovnik/api

The HTTP face of Domovník: it authenticates, builds a `RequestContext`, mounts whatever feature
modules exist and turns every failure into one envelope. It holds no business logic — the endpoints
that live here serve **kernel** entities (identity, approvals, API tokens), and everything with a
domain arrives through `src/features/modules.generated.ts` (AGENTS.md §2).

| Directory / file    | Contents                                                                       |
| ------------------- | ------------------------------------------------------------------------------ |
| `src/main.ts`       | the process: env, listen, shut the pools down                                  |
| `src/bootstrap.ts`  | the application itself, shared with the end-to-end tests                       |
| `src/app.module.ts` | composition: the kernel-owned modules, the feature modules, filters and guards |
| `src/http/`         | credentials → `RequestContext`, the guards, the exception filter               |
| `src/auth/`         | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`                        |
| `src/approvals/`    | the inbox, the decision, and the signed link from an e-mail                    |
| `src/api-tokens/`   | issuing, listing and revoking MCP/REST tokens (zadání kap. 9)                  |
| `src/health/`       | `GET /health`, including a database ping                                       |
| `src/openapi/`      | the document at `/openapi.json`                                                |
| `src/features/`     | the generated list of feature Nest modules and the composer that writes it     |
| `src/tests/`        | end-to-end tests over a real Postgres                                          |

## How a request gets its identity

A Fastify `onRequest` hook reads exactly one credential — the signed link in the URL, then
`Authorization: Bearer`, then the session cookie — resolves it through the kernel and opens an
`AsyncLocalStorage` scope for the rest of the request. A **rejected** credential is remembered, not
thrown: a hook that throws bypasses Nest's exception filter, and the answer would not carry the
`{ error: … }` shape. `AuthenticationGuard` raises it one step later instead.

Every route needs an identity unless it carries `@Public()`, so forgetting a decorator closes a
route rather than opening it. `@Roles()` and `@RequireSvjAccess()` narrow further.

## Zod on both sides of a route

`@Body({ schema })` and `@Query({ schema })` take the zod schema directly: Nest 12 validates against
any Standard Schema, and `@nestjs/swagger` 12 reads the same parameter metadata to describe the
request. `@Endpoint({ response })` does the answering side. One schema object therefore validates
**and** documents, so the two cannot drift — which is why there is no DTO class and no
zod-to-openapi bridge here. Only the error is ours: `http/validation.ts` swaps Nest's
`BadRequestException` for the kernel's `ValidationError`.

## Running it

`pnpm dev` runs it under `tsx`; `pnpm build` bundles it with tsup. The bundle is **CommonJS** on
purpose: relative imports carry no extension (ADR 0010), which Node refuses as ESM but resolves
happily as CJS, and Nest's own lazy `require()`s of optional packages keep working. Decorator
metadata comes from SWC — esbuild alone does not emit it and Nest's DI reads it.

**The rule:** a new feature is a new directory, never an edit here. `pnpm api:modules` re-reads
`packages/features/*/api/*.module.ts` and rewrites the generated list; a test fails if the committed
file no longer matches what is on disk. Nest needs its modules statically, so this is a committed
file rather than a runtime glob — a glob would survive `tsx` in dev and vanish in the bundle.
