import { defineAgent, promptFromFile } from '../../../../kernel/src/agents/index';

/**
 * Defining the agent registers it; `loadAgentsFrom` finds the file by glob, so a new agent is a new
 * directory and nothing else changes (ADR 0008, zadání §6.1).
 *
 * Autonomy is `propose`: everything with an effect on money goes through an `Approval` decided by
 * the committee (ADR 0006). The agent is given invoices with no warnings too, not because it has
 * to decide about them, but because what it produces is the sentence the committee reads.
 */
export const invoiceProcessor = defineAgent({
  name: 'invoice-processor',
  version: '1.0.0',
  description: 'Připraví schválení přijaté faktury pro výbor SVJ, nebo popíše, co chybí.',
  triggers: [{ event: 'finance.invoice.extracted' }, { event: 'finance.invoice.needs_review' }],
  scope: 'svj',
  model: 'sonnet',
  autonomy: 'propose',
  roles: ['finance'],
  tools: [
    'invoice.get',
    'invoice.supplierHistory',
    'document.get',
    'svj.get',
    'invoice.approve',
    'invoice.flagReview',
  ],
  prompt: promptFromFile(new URL('./prompt.md', import.meta.url)),
});
