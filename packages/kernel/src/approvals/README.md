# approvals

Human-in-the-loop as an entity, not as an exception. Anything with consequences — a payment, a
letter to an owner, an order — ends up as an `Approval` for someone entitled to decide.

| File        | Contents                                                                          |
| ----------- | --------------------------------------------------------------------------------- |
| `create.ts` | `createApproval` — records the pending proposal and an audit row                  |
| `decide.ts` | `decideApproval`, `expireApprovals`                                               |
| `events.ts` | `approval.decided` — the decision as a domain event                               |
| `list.ts`   | `listApprovals` (the inbox) and `getApproval`                                     |
| `resume.ts` | `resumeApproval` and the `approval-resume` subscription that the workers register |

States: `pending → approved | rejected | expired`, and on an approved row `executed_at` separately
records whether the deferred action has actually happened.

**The rule:** deciding and doing are two steps, and each is guarded by its own conditional UPDATE —
the application never decides whether it may proceed, the database does.

- `decide` moves `pending → approved` with `WHERE status = 'pending'`. A second call finds no row
  and fails with a `ConflictError`, so `approval.decided` is emitted at most once (ADR 0006).
- The deferred handler runs in `apps/workers`, not here (ADR 0015). `resumeApproval` writes the
  result and `executed_at` together with `WHERE executed_at IS NULL`, which is what keeps an
  at-least-once redelivery from repeating an action that already happened.

The handler runs as the person who approved it — `decided_by` plus their roles as they stand now —
not as `system`, so an action taken on someone's decision is attributable to them in the audit log.

Deciding needs the `approval.decide` permission, and where the approver list is non-empty, the actor
has to be on it. `listApprovals` filters by exactly that rule, so the inbox never shows a row the
actor would be refused on. An actor who may not decide at all gets an empty inbox, not an error.
