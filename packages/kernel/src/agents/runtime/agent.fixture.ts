import { z } from 'zod';
import { NotFoundError } from '../../errors/index';
import { defineTool } from '../../tools/registry/index';
import { defineAgent, type AgentDefinition } from '../definition';

export const REPLAY_FIXTURE = new URL('../fixtures/invoice-triage.replay.json', import.meta.url).pathname;

/** The id the fixture asks for when it wants the tool to fail. */
export const POISONED_INVOICE_ID = '8f14e45f-ceea-467a-9f30-1b0e0b0e0999';

export const invoiceTriage = (): AgentDefinition =>
  defineAgent({
    name: 'invoice-triage',
    version: '1.0.0',
    description: 'Zkontroluje fakturu a napíše shrnutí.',
    triggers: [{ event: 'finance.invoice.needs_review' }],
    scope: 'svj',
    model: 'sonnet',
    tools: ['invoice.get'],
    autonomy: 'read',
    prompt: 'Role: kontrolor faktur.\nPostup: načti fakturu a shrň ji.',
    roles: ['finance'],
  });

/** Registers the one read-only tool the replay fixture drives, recording every call into `calls`. */
export const registerInvoiceTool = (calls: string[]): void => {
  defineTool({
    name: 'invoice.get',
    description: 'Vrátí fakturu podle id. Použij, když potřebuješ částku a dodavatele.',
    input: z.object({ invoiceId: z.uuid() }),
    output: z.object({ total: z.number(), supplier: z.string() }),
    permission: 'finance.read',
    approval: () => ({ required: false, approvers: [] }),
    userComposable: true,
    readOnly: true,
    handler: (_ctx, input) => {
      if (input.invoiceId === POISONED_INVOICE_ID) {
        return Promise.reject(new NotFoundError('Faktura nenalezena', { code: 'invoice_missing' }));
      }
      calls.push(input.invoiceId);
      return Promise.resolve({ total: 1200, supplier: 'Výtahy s.r.o.' });
    },
  });
};
