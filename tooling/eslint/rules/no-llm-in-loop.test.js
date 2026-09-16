import noLlmInLoop from './no-llm-in-loop.js';
import { ruleTester } from './rule-tester.js';

/** @param {string} name */
const message = (name) =>
  `LLM call "${name}" inside a loop. Batch the items and emit one agent event (ADR 0004).`;

ruleTester.run('no-llm-in-loop', noLlmInLoop, {
  valid: [
    'const summary = await runAgent(ctx, agent, trigger);',
    'const rows = invoices.map((invoice) => invoice.total);',
    'for (const invoice of invoices) { total += invoice.total; }',
    'for (const invoice of invoices) { await repository.extract(invoice); }',
  ],
  invalid: [
    {
      code: 'for (const invoice of invoices) { await llm.extract(invoice); }',
      errors: [{ message: message('extract') }],
    },
    {
      code: 'while (queue.length > 0) { await runAgent(ctx, agent, queue.pop()); }',
      errors: [{ message: message('runAgent') }],
    },
    {
      code: 'await Promise.all(invoices.map((invoice) => llm.classify(invoice)));',
      errors: [{ message: message('classify') }],
    },
  ],
});
