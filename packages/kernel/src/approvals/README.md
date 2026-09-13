# approvals

Human-in-the-loop as an entity, not as an exception. Anything with consequences — a payment, a
letter to an owner, an order — ends up as an `Approval` for someone entitled to decide.

| File        | Contents                                                         |
| ----------- | ---------------------------------------------------------------- |
| `create.ts` | `createApproval` — records the pending proposal and an audit row |
| `decide.ts` | `decideApproval`, `expireApprovals`                              |
| `list.ts`   | `listApprovals` (the inbox) and `getApproval`                    |

States: `pending → approved | rejected | expired`.

**The rule:** a decision is single-shot and the database enforces it, not the application — `decide`
moves the state with a conditional UPDATE (`WHERE status = 'pending'`) and runs the deferred tool
handler only once that transition has gone through. A second call finds no `pending` row and fails
with a `ConflictError`, so the handler cannot run twice even under concurrency (ADR 0006).

Deciding needs the `approval.decide` permission, and where the approver list is non-empty, the actor
has to be on it. `listApprovals` filters by exactly that rule, so the inbox never shows a row the
actor would be refused on. An actor who may not decide at all gets an empty inbox, not an error.
