# receivables/adapters

Where the prescriptions and the balances of one SVJ come from. Pohoda has no SVJ module and every
management company keeps this differently, so this is a port with more than one implementation
(ADR 0005, zadání kap. 8).

| File                     | Contents                                                   |
| ------------------------ | ---------------------------------------------------------- |
| `receivables.adapter.ts` | the port: `ReceivablesAdapter` and the shape of every call |
| `selection.ts`           | which implementation an SVJ is on                          |
| `resolve.ts`             | the lookup itself: an SVJ in, an adapter out               |
| `internal/`              | our own records — the default, and all phase 1 needs       |
| `index.ts`               | the public face of this directory                          |

**The rule:** nothing outside this directory imports `internal/`. The choice of implementation is
per SVJ, so a caller that names one has decided something that is not its to decide — ask
`receivablesAdapterFor(ctx, svjId)` instead. `feature-via-index-only` in `.dependency-cruiser.cjs`
guards the feature from the outside, not its own inside, so this rule is on the reader.

`resolve.ts` answers `internal` for everyone today. The choice belongs on
`accounting_link.receivables_adapter`, and that table arrives with task 024; the lookup already
takes the context and the SVJ and already answers a promise, so reading that row then changes this
one file and nothing that calls it.
