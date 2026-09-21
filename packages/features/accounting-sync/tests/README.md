# accounting-sync/tests

| File                          | What it holds                                                      |
| ----------------------------- | ------------------------------------------------------------------ |
| `accounting.contract.test.ts` | the suite every `AccountingAdapter` answers, mock and real alike   |
| `xml.test.ts`                 | the `dataPack` documents, checked by hand and held by snapshots    |
| `links.int.test.ts`           | which accounting unit a house is, and who refuses to serve it      |
| `rls.int.test.ts`             | that one tenant cannot see another's rows in any of the new tables |
| `*.fixture.ts`                | the houses, invoices and rows those tests are written against      |

**No XSD is checked in.** Stormware's schemas are not ours to redistribute, so `xml.test.ts`
verifies the structure by hand — that the document parses, that the envelope names the accounting
unit, and that the invoice carries what ADR 0005 says it carries — and the snapshots hold the exact
documents. Validation against a real XSD belongs to the verification on POHODA Start that ADR 0005
names as the precondition for the mServer adapter.
