import { z } from 'zod';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { periodSchema } from '../domain/period';
import { prescriptionSchema } from '../domain/schemas';
import { listPrescriptions } from '../service/index';

/**
 * Defining the tool registers it; `loadToolsFrom` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6).
 */
export const receivablesListPrescriptions = defineTool({
  name: 'receivables.listPrescriptions',
  description:
    'Vypíše předpisy plateb jednoho SVJ za jeden měsíc: jednotka, variabilní symbol, částka, ' +
    'splatnost a rozpis položek. Použij, když potřebuješ vědět, co má kdo za daný měsíc platit. ' +
    'SVJ mimo rozsah přihlášení se chová, jako by neexistovalo.',
  input: z.object({ svjId: z.uuid(), period: periodSchema }),
  output: z.array(prescriptionSchema).readonly(),
  permission: 'finance.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) =>
    listPrescriptions(ctx, { svjId: svjIdSchema.parse(input.svjId), period: input.period }),
});
