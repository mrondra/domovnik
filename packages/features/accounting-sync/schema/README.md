# accounting-sync/schema

| File            | Tables                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| `link.ts`       | `accounting_link` — which accounting unit an SVJ is, and served by what |
| `jobs.ts`       | `sync_job` and `sync_conflict`                                          |
| `mock-store.ts` | `pohoda_mock_store` — what the demo's Pohoda has been told              |

**The rule:** a disagreement between our copy and Pohoda becomes a `sync_conflict`, never an
overwrite. Pohoda is the source of truth for the accounting (ADR 0005), and something changed there
was changed by a person who meant it.
