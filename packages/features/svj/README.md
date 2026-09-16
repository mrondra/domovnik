# svj

The management company's SVJ and their property: the SVJ record, its buildings and units, and the
company's own departments. Everything SVJ-scoped elsewhere in the platform points at an id from here.

| File / directory | Contents                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| `schema.ts`      | `svj`, `building`, `unit`, `department` — through `tenantTable`/`svjTable` |
| `domain/`        | types, the share fraction, the zod shapes and the two event definitions    |
| `service/`       | the only place that mutates; emits events and writes audit rows            |
| `tools/`         | `svj.get`, `svj.list`, `svj.listUnits` — read-only and user-composable     |
| `api/`           | the Nest module `apps/api` discovers, and its controllers                  |
| `ui/`            | the screens `apps/web` mounts, and the sidebar entry                       |
| `seed/`          | the three demo SVJ from zadání kap. 10, idempotent by IČO                  |
| `tests/`         | unit tests, the RLS isolation test for every table, and the HTTP tests     |
| `index.ts`       | the public face: what other features and apps may import                   |

**The rule:** everything outside this directory sees the feature through one of its two front doors —
`index.ts` for anything running on a server, `ui/index.ts` for a browser build (ADR 0017). Reach
another feature through those or through an event, never through its tables (docs/engineering.md §2).

Two decisions worth knowing before changing anything here:

- An SVJ the caller may not reach answers `NotFoundError`, not `ForbiddenError`. Narrowing comes from
  `reachableSvj` in the kernel — the actor's roles intersected with the SVJ scope of the credential
  they arrived with (ADR 0016) — so REST, MCP and agents all get the same answer.
- `ui/` fetches nothing. `apps/web` reads the API and passes the data in as props, which is what
  keeps the screens out of reach of the service (`ui-no-service` in `.dependency-cruiser.cjs`).
