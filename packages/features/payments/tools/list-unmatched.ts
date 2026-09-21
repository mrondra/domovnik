import { z } from 'zod';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { listUnmatched } from '../service/index';

/**
 * Defining the tool registers it; `loadToolsFrom` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6). It answers the whole batch in one call: an agent that asked per movement
 * would be doing in twenty turns what one turn can do (ADR 0004).
 */
export const paymentListUnmatched = defineTool({
  name: 'payment.listUnmatched',
  description:
    'Vypíše bankovní pohyby jednoho SVJ, které pravidla nedokázala spárovat: datum, částku, ' +
    'variabilní symbol, protistranu a zprávu. Použij jako první krok. Kladná částka je příjem, ' +
    'záporná výdaj.',
  input: z.object({ svjId: z.uuid() }),
  output: z
    .array(
      z.object({
        id: z.uuid(),
        bookedOn: z.iso.date(),
        amount: z.number(),
        variableSymbol: z.string().optional(),
        counterpartyName: z.string().optional(),
        message: z.string().optional(),
      }),
    )
    .readonly(),
  permission: 'finance.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) => listUnmatched(ctx, svjIdSchema.parse(input.svjId)),
});
