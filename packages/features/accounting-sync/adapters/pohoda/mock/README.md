# accounting-sync/adapters/pohoda/mock

The Pohoda the demo runs on. It is told the same documents a real one would be told, keeps them in
`pohoda_mock_store`, and answers from what it kept — so a demonstration survives a restart and the
contract test in `tests/` asks both implementations the same questions.

| File               | Contents                                                          |
| ------------------ | ----------------------------------------------------------------- |
| `adapter.ts`       | the `AccountingAdapter` itself, plus `mutateInvoice` for task 025 |
| `store.ts`         | what it has been told, read and amended                           |
| `invoice-state.ts` | a stored document read back as an invoice                         |
| `statements.ts`    | the movements it hands over for a period                          |
| `refs.ts`          | its stand-in for Pohoda's own ids, and the envelope it keeps      |

**The rule:** a reference is derived from what the document is about, never from a counter. Asking
twice about the same invoice is one invoice, which is what makes a retry safe.
