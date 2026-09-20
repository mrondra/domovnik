import { z } from 'zod';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { invoiceIdSchema } from '../domain/ids';
import { flagForReview } from '../service/index';

/**
 * The other half of the agent's job: an invoice the checks stopped cannot be proposed, so what the
 * agent contributes is a plain description of what is missing, written where whoever picks it up
 * will look. It changes no status — `needs_review` is already where the invoice belongs.
 */
export const invoiceFlagReview = defineTool({
  name: 'invoice.flagReview',
  description:
    'Zapíše k faktuře poznámku pro člověka: co jí chybí a co je potřeba doplnit. ' +
    'Použij pro fakturu, kterou zastavily kontroly. Stav faktury nemění.',
  input: z.object({
    invoiceId: z.uuid(),
    note: z.string().min(1),
    missing: z.array(z.string().min(1)).readonly(),
  }),
  output: z.object({ invoiceId: z.uuid(), status: z.string().min(1) }),
  permission: 'finance.write',
  approval: neverRequiresApproval,
  userComposable: false,
  readOnly: false,
  proposal: true,
  handler: async (ctx, input) => {
    const flagged = await flagForReview(ctx, {
      invoiceId: invoiceIdSchema.parse(input.invoiceId),
      note: input.note,
      missing: input.missing,
    });
    return { invoiceId: flagged.id, status: flagged.status };
  },
});
