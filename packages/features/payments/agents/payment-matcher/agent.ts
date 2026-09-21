import { defineAgent, promptFromFile } from '../../../../kernel/src/agents/index';

/**
 * Defining the agent registers it; `loadAgentsFrom` finds the file by glob, so a new agent is a new
 * directory and nothing else changes (ADR 0008, zadání §6.1).
 *
 * It is woken once per import with the whole residual, never once per movement (ADR 0004). What it
 * contributes is a choice between candidates the code worked out and a sentence saying why —
 * everything with an effect on money goes through an `Approval` decided by finance (ADR 0006).
 */
export const paymentMatcher = defineAgent({
  name: 'payment-matcher',
  version: '1.0.0',
  description: 'Navrhne, čeho se týkají bankovní pohyby, které pravidla nespárovala.',
  triggers: [{ event: 'finance.transactions.unmatched' }],
  scope: 'svj',
  model: 'sonnet',
  autonomy: 'propose',
  roles: ['finance'],
  tools: [
    'payment.listUnmatched',
    'payment.candidates',
    'payment.proposeMatch',
    'payment.markIgnored',
    'receivables.unitBalance',
  ],
  prompt: promptFromFile(new URL('./prompt.md', import.meta.url)),
});
