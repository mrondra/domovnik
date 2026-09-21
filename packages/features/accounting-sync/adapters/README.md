# accounting-sync/adapters

How the platform talks to the accounting (ADR 0005). Pohoda is the source of truth; we tell it what
was approved and what was paid, and read back what it says.

| File / directory        | Contents                                                         |
| ----------------------- | ---------------------------------------------------------------- |
| `accounting.adapter.ts` | the port: post an invoice, settle it, read statements back       |
| `pohoda/xml/`           | the `dataPack` documents, and reading a `responsePack`           |
| `pohoda/mock/`          | an in-memory Pohoda the demo runs on, kept in a table            |
| `pohoda/mserver/`       | the HTTP side of a real one — unverified and untested            |
| `resolve.ts`            | which implementation an SVJ is served by, from `accounting_link` |

**The rule:** nothing outside this directory names an implementation — ask
`accountingAdapterFor(ctx, svjId)`.

`mserver` is deliberately not reachable through `resolve.ts`. Its documents have never been put in
front of a real Pohoda, and an SVJ pointed at it would fail somewhere downstream with an accounting
error nobody could read. It refuses up front instead, and says why.

The mock keeps what it was told in `pohoda_mock_store` rather than in memory, so a demonstration
survives a restart — and so `fetchInvoice` can answer, which is what makes a disagreement between
the two sides detectable at all.
