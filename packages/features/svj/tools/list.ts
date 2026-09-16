import { z } from 'zod';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { svjSummarySchema } from '../domain/schemas';
import { listForActor } from '../service/index';

/**
 * The entry point for a model that does not know any id yet. It answers only the SVJ the caller may
 * reach — their roles intersected with the SVJ scope of the token they arrived with (ADR 0016).
 */
export const svjList = defineTool({
  name: 'svj.list',
  description:
    'Vypíše SVJ dostupná přihlášenému aktérovi, s názvem a počtem jednotek. ' +
    'Použij jako první krok, když potřebuješ id SVJ. Nevrací SVJ mimo rozsah přihlášení.',
  input: z.object({}),
  output: z.array(svjSummarySchema).readonly(),
  permission: 'svj.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx) => listForActor(ctx),
});
