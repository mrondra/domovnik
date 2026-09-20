import { z } from 'zod';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { invoiceIdSchema } from '../domain/ids';
import { budgetStatusSchema, contractSchema, invoiceSchema } from '../domain/schemas';
import { invoiceDossier } from '../service/index';

/**
 * Defining the tool registers it; `loadToolsFrom` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6).
 */
export const invoiceGet = defineTool({
  name: 'invoice.get',
  description:
    'Vrátí jednu fakturu se vším, co se o ní ví: stav, extrahované údaje, výsledky kontrol, ' +
    'navázanou smlouvu a stav rozpočtové kategorie. Použij jako první krok u každé faktury. ' +
    'Fakturu mimo rozsah přihlášení nevrací.',
  input: z.object({ invoiceId: z.uuid() }),
  output: z.object({
    invoice: invoiceSchema,
    extraction: z.unknown(),
    checks: z.unknown(),
    contract: contractSchema.nullable(),
    budget: budgetStatusSchema.nullable(),
  }),
  permission: 'finance.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) => invoiceDossier(ctx, invoiceIdSchema.parse(input.invoiceId)),
});
