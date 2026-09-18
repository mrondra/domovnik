# invoices/adapters

Where an invoice arrives from (zadání kap. 8).

| File                        | Contents                                                      |
| --------------------------- | ------------------------------------------------------------- |
| `inbound-mail.adapter.ts`   | the port: one message, and what an inbox has to be able to do |
| `simulated-inbound-mail.ts` | the demo inbox, which is pushed to rather than polled         |
| `resolve.ts`                | which implementation is in use                                |
| `index.ts`                  | the public face of this directory                             |

**The rule:** nothing outside this directory names an implementation — ask `inboundMailAdapter()`.
The simulated inbox differs from a real IMAP one in exactly one thing, whether it fetches for
itself; everything the message is then put through is the same code, which is the point of having
the port at all in a demo with one implementation.
