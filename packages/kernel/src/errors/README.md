# errors

The error taxonomy every layer throws, and how it crosses the system boundaries.

| File          | Contents                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `taxonomy.ts` | `DomainError`, `NotFoundError`, `ForbiddenError`, `ValidationError`, `ConflictError`, `AdapterError { retryable }` |
| `http.ts`     | `toHttpStatus()` for the API and `toToolErrorResult()` for the model                                               |

Every error carries `code`, `details` and `cause`. `code` defaults to the error type, but a domain
rule may name its own: `new DomainError('duplicita', { code: 'invoice_duplicate' })`.

**The rule:** never `throw new Error(...)` — lint catches it. And `toToolErrorResult()` lets only
`code` and `message` through to the model; never a stack or `details`, which are operator
information and would just crowd the agent's context.
