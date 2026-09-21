# accounting-sync/adapters/pohoda/xml

The `dataPack` documents Pohoda is spoken to in, and the `responsePack` it answers with.

| File                | Contents                                                          |
| ------------------- | ----------------------------------------------------------------- |
| `data-pack.ts`      | the envelope: who asks, about which accounting unit, and what for |
| `invoice.ts`        | `inv:invoice` for a received invoice                              |
| `liquidation.ts`    | settling one, and by which bank movement                          |
| `bank-statement.ts` | asking for the movements of a period                              |
| `parse.ts`          | reading the answer, including a refusal                           |
| `escape.ts`         | the two or three characters that otherwise break a document       |
| `builders.ts`       | the public face of this directory                                 |

**Unverified against a real Pohoda.** Task 024 names verification on POHODA Start as a precondition
and it has not happened, so these documents follow the public `dataPack` 2.x documentation and
nothing more. Specifically unconfirmed:

- `inv:classificationVAT` — the classification is a constant from the deployment's config; a real
  installation has its own and will reject an unknown one.
- `inv:liquidation` — settling a document through the invoice agenda rather than through the bank
  agenda. There is more than one way to do this in Pohoda and this is the one the documentation
  describes; which one a given installation accepts is the thing to check first.
- `lst:listBankRequest` attributes (`bankVersion`, `bankType`) and the shape of the filter.
- Whether `producedDetails/id` or the item's `@id` is the durable reference. Both are read.

The amounts go into the VAT summary rather than into item lines. What is known for certain about a
received invoice is its total and its tax; inventing a breakdown Pohoda would then book is worse
than not sending one (ADR 0005).
