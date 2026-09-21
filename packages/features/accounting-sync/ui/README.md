# accounting-sync/ui

The browser side of this feature (ADR 0017). The screens fetch nothing: a page in `apps/web` reads
the API and hands the data in.

| File                         | Contents                                                   |
| ---------------------------- | ---------------------------------------------------------- |
| `AccountingStatusScreen.tsx` | the whole screen: where the house is booked, what happened |
| `LinkCard.tsx`               | the accounting unit and when the two sides last agreed     |
| `ConflictTable.tsx`          | the differences, both sides side by side                   |
| `JobTable.tsx`               | what was last said to Pohoda, and what it answered         |
| `labels.ts`, `wire.ts`       | Czech names for what the API returns, and its shape        |
| `navigation.ts`              | where the screen sits in the shell                         |

**The rule:** neither side of a difference is shown as the right one. Which one wins is a decision
a person makes, and the screen's job is to make the difference legible.
