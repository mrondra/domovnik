# testing/replay

The local endpoint `ANTHROPIC_BASE_URL` points at during tests. An agent run then goes through a
real subprocess and the real tool loop, but without the network and without the non-determinism.

| File            | Contents                                                   |
| --------------- | ---------------------------------------------------------- |
| `fixture.ts`    | the zod schema of a fixture (exchanges, matchers, message) |
| `server.ts`     | the `LlmReplay` interface and starting/stopping the server |
| `replay-llm.ts` | serving recorded answers                                   |
| `record-llm.ts` | a proxy to the real API that stores what came back         |

**The rule:** fixtures are matched **by request content**, not by order. Around its own turn the
harness also sends housekeeping calls (naming the session) and retries failures; a counter would
drift apart. An exchange therefore states what the request body must and must not contain:

```json
{ "name": "calls-invoice-get", "when": { "contains": ["invoice_get"], "missing": ["tool_result"] } }
```

A request no exchange matches gets a 400 naming the fixture — not a quiet empty answer.
