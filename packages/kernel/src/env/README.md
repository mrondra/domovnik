# env

The configuration boundary. `loadEnv()` validates the whole environment once against a zod schema
and caches the result; on failure it names every bad variable at once, not just the first.

| File        | Contents                                                                   |
| ----------- | -------------------------------------------------------------------------- |
| `schema.ts` | the zod schema of every variable, including defaults                       |
| `load.ts`   | `loadEnv`, `resetEnvCache`, `logLevel`, `inheritedEnv`, `adminDatabaseUrl` |

**The rule:** this is the only place in the repository that reads `process.env`. Everything else
calls `loadEnv()`. There are two exceptions and both are named: `logLevel()` (the log level is
needed before validation can run, so that a configuration error is loggable at all) and
`inheritedEnv()` (the base environment for the process the agent runtime spawns).

`DATABASE_URL` is the application role without `BYPASSRLS`; `DATABASE_ADMIN_URL` is the schema
owner — see ADR 0013.
