# receivables/ui

What the house was asked to pay, and who has not paid it.

| File                       | Contents                                                      |
| -------------------------- | ------------------------------------------------------------- |
| `PrescriptionsScreen.tsx`  | one month: every unit, its symbol, what the amount is made of |
| `DebtorsScreen.tsx`        | who owes, how much, and since which month                     |
| `labels.ts`                | Czech, and a debt shown as the positive number people say     |
| `navigation.ts`, `wire.ts` | where it sits in the shell, and what data arrives as          |

**The rule:** nothing here fetches. `apps/web` reads the API and passes the data in as props
(ADR 0017), and a unit is named by a function the application hands down — ids mean nothing to a
committee member.

A debt is a negative balance in the ledger and a positive number on the screen. The oldest unpaid
month is shown next to it, because a unit that owes one month and a unit that owes twelve are two
different conversations.
