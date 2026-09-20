# invoices/service/extraction

Turning the file an invoice arrived as into fields the rest of the platform can work with — and then
deciding, deterministically, whether anyone needs to look at it.

| File         | Contents                                                           |
| ------------ | ------------------------------------------------------------------ |
| `text.ts`    | the text layer of the PDF; too little of it is itself the finding  |
| `schema.ts`  | what a Czech invoice says, as the model is asked to return it      |
| `prompt.md`  | the prompt, in Czech, because a person reviews it                  |
| `extract.ts` | the one model call — the whole invoice, lines included             |
| `match.ts`   | who sent it, under which contract, and therefore which budget line |
| `patch.ts`   | what all that writes onto the invoice, inventing nothing           |
| `process.ts` | the step itself: read, extract, match, check, and move the invoice |

**The rule:** one model call per invoice, never one per line. A line only means anything next to the
rest of the document, and a call in a loop is slower, dearer and worse (`no-llm-in-loop`, AGENTS.md §7).

Everything the model returns is treated as a claim, not a fact: a date in the wrong shape is dropped
rather than coerced, an empty string is the same as nothing, and a number is never recomputed. The
rules in `../checks/` are what decides, and they are deterministic.

`process.ts` answers the invoice unchanged when it is no longer `received`. Delivery is
at-least-once, so that is what keeps a redelivered event from extracting the same file twice.
