# payments/adapters/synthetic

The bank the demo runs on. It answers what the house's own prescriptions and posted invoices say
should have moved, bent by the profile of that house (task 021).

| File           | Contents                                                                  |
| -------------- | ------------------------------------------------------------------------- |
| `profile.ts`   | how the units of one house behave — and what a mistyped symbol looks like |
| `periods.ts`   | the accounting months a range of days covers                              |
| `generator.ts` | the statement itself: what came in, what went out                         |
| `index.ts`     | the adapter, which looks the house up and picks its profile               |

**The rule:** no randomness anywhere. A statement is a function of the prescriptions the house was
sent, the invoices it has posted and its profile, so the same range always generates the same
movements. That is what makes importing it twice add nothing and a demonstration repeatable.

The profiles are the whole of what makes the demo worth watching. One house pays like a textbook,
so the rules settle everything and no agent is woken. One has three units that never pay, two that
swap the last two digits of the variable symbol and one that pays two months at once — that house
is where the residual comes from. One has somebody two hundred crowns short.
