# payments/ui

The statement as a person reads it, and what each movement turned out to be about.

| File                                      | Contents                                                  |
| ----------------------------------------- | --------------------------------------------------------- |
| `TransactionListScreen.tsx`               | the movements, filtered by what somebody came to look for |
| `TransactionDetailScreen.tsx`             | one movement, its pairing, the agent's proposal, the rest |
| `ManualMatch.client.tsx`                  | pairing by hand — by choosing, never by typing an id      |
| `ApprovalEvidence.tsx`                    | the same proposal as the approval inbox shows it          |
| `MatchStatusBadge.tsx`                    | one state, one colour                                     |
| `labels.ts`                               | Czech for every state, method and reason                  |
| `navigation.ts`, `evidence.ts`, `wire.ts` | what the shell composes and what data arrives as          |

**The rule:** nothing here fetches, and nothing here decides. `apps/web` reads the API and passes
the data in; `onMatch` is omitted for somebody who may read the statement but not pair anything, so
the buttons are not there — and the API refuses them anyway (zadání kap. 9).

Pairing by hand offers the same candidates the agent chooses from. There is deliberately no field
to type a target into: a target nobody computed is a target nobody can check, and if the right
answer is missing from the list then the list is what needs fixing.
