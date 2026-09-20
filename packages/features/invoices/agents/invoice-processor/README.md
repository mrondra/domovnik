# invoice-processor

The agent that turns an invoice the platform has already read into something a committee member can
decide about — or, when the checks stopped it, into a plain description of what is missing.

| File        | Contents                                                           |
| ----------- | ------------------------------------------------------------------ |
| `agent.ts`  | the definition: triggers, tools, autonomy, the roles it acts under |
| `prompt.md` | what it is asked to do, in Czech, because a person reviews it      |

**The rule:** it never decides. `autonomy: 'propose'` and `invoice.approve` always requires an
approval, so the invoice reaches `pending_approval` and stops there until the committee says
otherwise (ADR 0006, ADR 0015). What the agent contributes is the sentence, not the outcome.

It does not re-check the numbers either. Whether the amount matches the contract, whether the budget
has room and whether the invoice is a duplicate were all settled deterministically before it was
woken (ADR 0004, `service/checks/`) — asking a model to redo that would be slower, dearer and less
reliable. It is given the result as a fact and writes about it.

The prompt says nothing about which tools exist beyond the ones it should reach for: the runtime
intersects the agent's tool list with the permissions of its roles, so a limit the runtime enforces
does not need repeating in prose.
