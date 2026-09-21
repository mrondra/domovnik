# accounting-sync/subscribers

What makes this feature act without anybody asking it to.

| File              | Listens to                 | Does                                                    |
| ----------------- | -------------------------- | ------------------------------------------------------- |
| `post-invoice.ts` | `finance.invoice.approved` | writes the invoice into the accounting, marks it posted |
| `liquidate.ts`    | `finance.payment.matched`  | tells the accounting an invoice was paid                |
| `tick-daily.ts`   | `tick.daily`               | reads posted invoices back and records disagreements    |

**The rule:** every handler is idempotent, because delivery is at-least-once. Each one asks what it
has already done — the invoice's own status, or a finished `sync_job` — before it does it again.

**On failure:** the kernel turns any exception into a pg-boss retry (five attempts, backoff). A
non-retryable `AdapterError` is a refusal, not a bad day, so it is written down and swallowed
rather than repeated five times.
