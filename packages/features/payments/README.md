# payments

The money that actually moved: what arrived on the SVJ's account, what left it, and what each
movement turned out to be about. Pohoda stays the source of truth for the accounting (ADR 0005);
what lives here is the matching in front of it.

| File / directory | Contents                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| `schema.ts`      | `bank_account`, `bank_transaction`, `payment_match` — all via `svjTable` |
| `domain/`        | the types and the three events                                           |
| `matching/`      | the rules, what they are applied against, and one pass over a batch      |
| `service/`       | the accounts, and a statement coming in                                  |
| `api/`           | the Nest module `apps/api` discovers; no controller before task 023      |
| `tests/`         | the RLS isolation tests, the rules table test, and the acceptance case   |
| `index.ts`       | the public face: what other features and apps may import                 |

**The rule:** everything outside this directory sees the feature through `index.ts` only. Reach
another feature through its `index.ts` or an event, never through its tables (docs/engineering.md §2).

Three decisions worth knowing before changing anything here:

- **The rules come first, and the residual is one event.** Two hundred movements that the variable
  symbol and the amount settle between them are two hundred rows and no agent at all; what is left
  leaves as a single `finance.transactions.unmatched` for the batch, so the agent is woken once
  (ADR 0004, zadání kap. 7).
- **A known symbol with the wrong amount is not a match.** It is a double payment, a part payment
  or two months at once — a question, and questions belong to the residual with a hint saying what
  was already established.
- **An `approved` invoice is not paid, however exact the amount.** `paid` follows the accounting
  entry, and that is `posted`. Marking it here would put us out of step with Pohoda.

The agent never invents a target. `payment.candidates` is computed by code — a symbol one slip of
the fingers away, a unit whose whole debt is exactly what arrived, two or three months added up, an
invoice of the right amount — and `payment.proposeMatch` refuses anything that is not on that list,
both when it is proposed and again when it is approved. A wrong pairing is therefore a bug in
`matching/` that can be fixed and tested.

Importing the same statement twice adds nothing: the bank's own id for a movement is unique per
account, and only rows that were really written go through the rules.
