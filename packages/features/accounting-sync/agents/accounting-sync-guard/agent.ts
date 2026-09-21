import { defineAgent, promptFromFile } from '../../../../kernel/src/agents/index';

/**
 * Defining the agent registers it; `loadAgentsFrom` finds the file by glob, so a new agent is a new
 * directory and nothing else changes (ADR 0008, zadání §6.1).
 *
 * It is woken once per sweep with every disagreement found, never once per invoice (ADR 0004).
 * What it contributes is a reading of two numbers that differ and a sentence saying which one it
 * would keep — the decision belongs to finance, through an `Approval` (ADR 0006).
 */
export const accountingSyncGuard = defineAgent({
  name: 'accounting-sync-guard',
  version: '1.0.0',
  description: 'Popíše rozdíly mezi Domovníkem a účetnictvím a navrhne, jak je uzavřít.',
  triggers: [{ event: 'finance.sync.conflict' }],
  scope: 'svj',
  model: 'sonnet',
  autonomy: 'propose',
  roles: ['finance'],
  tools: ['accounting.getConflict', 'invoice.get', 'accounting.proposeResolution'],
  prompt: promptFromFile(new URL('./prompt.md', import.meta.url)),
});
