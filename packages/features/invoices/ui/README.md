# invoices/ui

The screens `apps/web` mounts, and the two things this feature contributes to the shell: its place
in the navigation, and how its proposals look in the approval inbox.

| File                      | Contents                                                  |
| ------------------------- | --------------------------------------------------------- |
| `InvoiceListScreen.tsx`   | the table, in either scope — across SVJ or inside one     |
| `InvoiceDetailScreen.tsx` | the whole story of one invoice                            |
| `InvoiceFacts.tsx`        | the numbers as they were read; nothing is recomputed here |
| `ChecksList.tsx`          | what the deterministic rules found, with Czech labels     |
| `AgentEvidence.tsx`       | what the agent proposed, what it cost, where its trace is |
| `ApprovalEvidence.tsx`    | the same proposal as the approval inbox shows it          |
| `InvoiceStatusBadge.tsx`  | one status, one colour                                    |
| `labels.ts`               | Czech for every status, category and check code           |
| `wire.ts`                 | the zod the screens are handed data in                    |
| `navigation.ts`           | where „Faktury" sits in the shell                         |
| `evidence.ts`             | the renderer registry `apps/web` composes                 |

**The rule:** nothing here fetches. `apps/web` reads the API and passes the data in as props, which
is what keeps the screens out of reach of the service (`ui-no-service` in `.dependency-cruiser.cjs`)
and a Next build out of reach of Nest (ADR 0017).

Routes are the application's, not the feature's: a screen that links somewhere takes an `href`
builder as a prop. That is why the same list component serves `/invoices` and `/s/<svjId>/invoices`.
