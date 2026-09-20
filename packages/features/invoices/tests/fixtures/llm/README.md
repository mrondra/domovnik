# tests/fixtures/llm

Recorded answers for `llm.extract`, served back by `LLM_MODE=replay` so the tests run offline and
give the same answer every time. The file name is the hash of the request — model, limits, prompt
and output schema — so a change to `service/extraction/prompt.md` or to `extractedInvoiceSchema`
invalidates them by design: the test then fails with `llm_fixture_missing` instead of quietly
replaying an answer to a question nobody asks any more.

**These four were written by hand, not recorded from the model.** Their content is what a correct
reading of `tests/fixtures/invoice-scenarios.ts` looks like, which is what the pipeline around the
model is tested against: the checks, the transitions, the patch and the idempotency. What they do
**not** test is whether the prompt actually gets that reading out of Haiku.

To replace them with real recordings, with an `ANTHROPIC_API_KEY` in the environment:

```
LLM_MODE=record LLM_FIXTURE_DIR=packages/features/invoices/tests/fixtures/llm \
  pnpm vitest run --project integration packages/features/invoices/tests/extraction.int.test.ts
```

Then check the diff: a field the model read differently is a finding about the prompt, not a test to
be adjusted.
