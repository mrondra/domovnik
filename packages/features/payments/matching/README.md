# payments/matching

What a movement on a bank statement turns out to be about. Everything here that can be decided by a
rule is decided by a rule; what is left is the residual, and the residual is the agent's (ADR 0004).

| File            | Contents                                                          |
| --------------- | ----------------------------------------------------------------- |
| `rules.ts`      | the decisions themselves — pure, and testable without a database  |
| `candidates.ts` | what a decision is made against: the prescription, or the invoice |
| `apply.ts`      | writing a match down, settling it, and announcing it              |
| `match.ts`      | one pass over a batch, sorted into settled and residual           |

**The rule:** `rules.ts` takes numbers and answers a decision. It reads nothing and writes nothing,
so the ten cases that matter — exact, off by half a crown, twice the amount, somebody else's symbol,
an invoice that has not been posted — are a table test and not an afternoon with a database.

Two decisions worth knowing:

- A payment whose variable symbol is known but whose amount is not what was asked for is **not**
  matched. It is a question — a double payment, a part payment, two months at once — and the hint
  says what was already established, so the agent starts from there rather than from nothing.
- An invoice that is `approved` but not yet `posted` is not called paid, even when the amount is
  exactly right. `paid` follows the accounting entry, and Pohoda is where that lives (ADR 0005).
