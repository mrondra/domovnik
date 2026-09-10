# logger

Structured logging (pino) and a logger bound to a `RequestContext`.

| File           | Contents                                                            |
| -------------- | ------------------------------------------------------------------- |
| `redaction.ts` | the keys that must never appear in a log line                       |
| `logger.ts`    | the root logger, `createLogger(bindings)`, `withLogger`, `logger()` |

`logger()` returns the logger from the ambient context (`runInContext` installs it), so nested code
logs with `tenantId`, `correlationId` and, where there is one, `agentRunId`, without passing a
logger down by hand.

**The rule:** pino redacts `password`, `token`, `authorization`, `email` and `phone` before
serialisation, two levels deep. Do not treat that as the only safeguard, though — document contents
and owners' personal data do not go into the log at all.
