# payment-matcher

The agent that reads the movements the rules could not settle and says what each one is probably
about — or says nothing, which is a valid answer and often the right one.

| File        | Contents                                                          |
| ----------- | ----------------------------------------------------------------- |
| `agent.ts`  | the definition: trigger, tools, autonomy, the roles it acts under |
| `prompt.md` | what it is asked to do, in Czech, because a person reviews it     |

**The rule:** it chooses, it does not invent. `payment.candidates` is computed by code — symbols one
edit away, units whose whole debt is exactly what arrived, two or three months added up, invoices of
the right amount — and the agent may only propose a target that was on that list. A wrong pairing is
therefore a bug in `matching/search.ts`, which can be fixed and tested, rather than a model having a
bad day (ADR 0004).

It never pairs anything itself. `payment.proposeMatch` always requires an approval, decided by
finance, and the movement is marked `proposed` the moment the approval exists so nobody else picks
it up meanwhile (ADR 0006, ADR 0015).

One run per import, not one per movement. The trigger carries the whole batch, and the first thing
the prompt asks for is the whole batch.
