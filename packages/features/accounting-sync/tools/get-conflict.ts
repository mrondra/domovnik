import { z } from 'zod';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { syncConflictIdSchema } from '../domain/ids';
import { getConflict } from '../service/index';

/**
 * Defining the tool registers it; `loadToolsFrom` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6). Both sides of the disagreement come back untouched — reading it is what the
 * agent does before it proposes anything.
 */
export const accountingGetConflict = defineTool({
  name: 'accounting.getConflict',
  description:
    'Vrátí jeden konflikt mezi Domovníkem a účetnictvím: čeho se týká, které pole se liší, naše ' +
    'hodnota a hodnota z Pohody. `entityId` je id faktury — podrobnosti o ní si vyžádej přes ' +
    'invoice.get.',
  input: z.object({ conflictId: z.uuid() }),
  output: z.object({
    id: z.uuid(),
    entityType: z.string(),
    entityId: z.uuid(),
    field: z.string(),
    ours: z.unknown(),
    theirs: z.unknown(),
    status: z.enum(['open', 'resolved']),
  }),
  permission: 'finance.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) => getConflict(ctx, syncConflictIdSchema.parse(input.conflictId)),
});
