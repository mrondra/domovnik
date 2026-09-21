# accounting-sync/agents/accounting-sync-guard

Reads the disagreements one sweep found and proposes how to close each one. Woken by
`finance.sync.conflict` with the whole batch; autonomy `propose`, so everything it decides goes to
finance as an `Approval` (ADR 0006).

| File        | Contents                                               |
| ----------- | ------------------------------------------------------ |
| `agent.ts`  | the registration: triggers, tools, autonomy, model     |
| `prompt.md` | what it is for, how to read each field, when to say no |

**The rule:** it never proposes touching Pohoda. The books are the accounting's (ADR 0005); what
this agent settles is which value our side should regard as true, and a person signs even that.
