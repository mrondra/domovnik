# invoices/service/checks

Everything the platform can decide about an extracted invoice without asking anyone. What survives
these rules is the residual, and the residual is what the agent is asked about (ADR 0004).

| File           | Check                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| `supplier.ts`  | `supplier_unknown` (blocking) — the IČO is not in the address book         |
| `contract.ts`  | `contract_missing` (warning) — no contract in force for this SVJ that day  |
| `amount.ts`    | `amount_deviates` (warning) — more than 10 % off the agreed monthly amount |
| `budget.ts`    | `budget_exceeded` (warning) — the line has less left than the invoice asks |
| `duplicate.ts` | `duplicate_number` (blocking) — the same supplier and number already filed |
| `basics.ts`    | `due_soon` and `vs_missing` (info) — what needs nothing but the extraction |
| `run.ts`       | all of them in one pass, in the order a person would read them             |

**The rule:** a check reports, it never decides. `blocking` means a person has to look and the
invoice goes to `needs_review`; `warning` is what the agent writes its summary from; `info` is
context. What to do about them is `service/extraction/process.ts`, in one place.

Nothing here throws. A rule that cannot be evaluated — no contract to compare against, no budget
planned, an unparseable date — answers `null`, because "we could not tell" is not a finding.
