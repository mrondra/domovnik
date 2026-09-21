import { z } from 'zod';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { bankTransactionIdSchema } from '../domain/ids';
import { candidatesFor } from '../matching/search';
import { getTransaction } from '../service/index';

/**
 * What the movement could be about, worked out by code. The agent chooses between these and says
 * why; it never proposes anything that is not on this list. That is what keeps a wrong pairing a
 * bug in `matching/search.ts` rather than a model having a bad day (ADR 0004).
 */
export const paymentCandidates = defineTool({
  name: 'payment.candidates',
  description:
    'Vrátí možnosti, čeho se pohyb může týkat, spočítané kódem: předpisy s variabilním symbolem ' +
    'na jeden překlep, jednotky se saldem přesně ve výši částky, dva nebo tři měsíce předpisu ' +
    'dohromady, faktury se sedící částkou. Navrhuj jen to, co je v této odpovědi.',
  input: z.object({ transactionId: z.uuid() }),
  output: z
    .array(
      z.object({
        targetType: z.enum(['prescription', 'invoice']),
        targetId: z.uuid(),
        amount: z.number(),
        label: z.string().min(1),
        because: z.enum(['symbol_typo', 'balance_matches', 'two_months', 'invoice_amount']),
      }),
    )
    .readonly(),
  permission: 'finance.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: async (ctx, input) =>
    candidatesFor(ctx, await getTransaction(ctx, bankTransactionIdSchema.parse(input.transactionId))),
});
