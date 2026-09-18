import { z } from 'zod';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { unitBalanceSchema } from '../domain/schemas';
import { listDebtors } from '../service/index';

/** The entry point for dunning: who owes, and how much, before anyone is written to. */
export const receivablesListDebtors = defineTool({
  name: 'receivables.listDebtors',
  description:
    'Vypíše jednotky jednoho SVJ, které dluží alespoň `minDebt` korun, od největšího dluhu. ' +
    'Použij jako první krok u upomínek. Dokud nejsou naimportované platby, dluží všechny ' +
    'jednotky – to není chyba.',
  input: z.object({ svjId: z.uuid(), minDebt: z.number().nonnegative() }),
  output: z.array(unitBalanceSchema).readonly(),
  permission: 'finance.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) =>
    listDebtors(ctx, { svjId: svjIdSchema.parse(input.svjId), minDebt: input.minDebt }),
});
