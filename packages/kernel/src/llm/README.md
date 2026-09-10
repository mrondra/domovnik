# llm

Direct model calls **outside** the agent loop: summarising, structured extraction, classification.
Agents are run by `agents/runtime`, not by this module.

| File          | Contents                                                   |
| ------------- | ---------------------------------------------------------- |
| `client.ts`   | the Anthropic SDK client                                   |
| `models.ts`   | the `sonnet` and `haiku` aliases mapped to concrete models |
| `request.ts`  | request assembly, token accounting, record/replay          |
| `complete.ts` | `llm.complete` — free text                                 |
| `extract.ts`  | `llm.extract(schema)` — structured output validated by zod |
| `classify.ts` | `llm.classify(labels)` — one of the offered categories     |
| `fixtures.ts` | reading and writing recorded answers                       |
| `tracing.ts`  | Langfuse; without credentials tracing becomes a no-op      |

Model tiering follows zadání §6.1: Sonnet decides, Haiku extracts and classifies. `extract` and
`classify` therefore target Haiku on their own.

**The rule:** `LLM_MODE=record` stores a live answer in `LLM_FIXTURE_DIR` under a digest of the
request; `LLM_MODE=replay` serves it back and never touches the network. A missing fixture is an
error, not a quiet fall-through to the network. And an LLM never runs in a loop over items — lint
catches that (ADR 0004).
