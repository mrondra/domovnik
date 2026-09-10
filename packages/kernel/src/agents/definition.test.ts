import { describe, expect, it } from 'vitest';
import { agentsForEvent, clearAgents, defineAgent, promptFromFile, registeredAgents } from './definition';

const definition = {
  name: 'invoice-processor',
  version: '1.0.0',
  description: 'Zpracuje fakturu.',
  triggers: [{ event: 'finance.invoice.received' }],
  scope: 'svj',
  model: 'sonnet',
  tools: ['invoice.get'],
  autonomy: 'propose',
  prompt: 'Role: zpracovatel faktur.',
  roles: ['finance'],
} as const;

describe('agent registry', () => {
  it('registers an agent as a side effect of defining it', () => {
    clearAgents();
    defineAgent(definition);
    expect(registeredAgents().map((agent) => agent.name)).toEqual(['invoice-processor']);
  });

  it('finds the agents subscribed to an event', () => {
    clearAgents();
    defineAgent(definition);
    expect(agentsForEvent('finance.invoice.received')).toHaveLength(1);
    expect(agentsForEvent('finance.invoice.posted')).toHaveLength(0);
  });

  it('reads a prompt from a file next to the agent', () => {
    expect(promptFromFile(new URL('./fixtures/invoice-triage.replay.json', import.meta.url))).toContain(
      'exchanges',
    );
  });
});
