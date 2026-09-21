# payments/adapters

Where a bank statement comes from (zadání kap. 8).

| File              | Contents                                                     |
| ----------------- | ------------------------------------------------------------ |
| `bank.adapter.ts` | the port: an account and a stretch of time in, movements out |
| `synthetic/`      | the demo bank, derived from what the house was asked to pay  |
| `pohoda-bank.ts`  | the statement as the accounting holds it (zadání kap. 8)     |
| `resolve.ts`      | which implementation serves which house                      |
| `index.ts`        | the public face of this directory                            |

**The rule:** nothing outside this directory names an implementation — ask `bankAdapterFor()`.
Which one a house gets is written in its accounting link (`config.bankSource`), not in code.

The generated statement is not invented. It is a function of the prescriptions the house was sent
and the invoices it has posted, bent by a profile: one house pays like a textbook, one is where the
residual comes from, one pays a little short. There is no randomness anywhere, so the same range
generates the same movements — which is what makes importing it twice add nothing, and what makes
a demonstration repeatable.

The profiles live in `synthetic/profile.ts` and are the whole of what makes the demo interesting:
three units that never pay, two that swap two digits of the variable symbol, one that pays two
months at once, and one house where somebody is two hundred crowns short.
