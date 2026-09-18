import { z } from 'zod';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { unitIdSchema } from '../../svj/index';
import { unitBalanceSchema } from '../domain/schemas';
import { unitBalance } from '../service/index';

/** The statement of one unit: what was prescribed, what was paid, and what is left. */
export const receivablesUnitBalance = defineTool({
  name: 'receivables.unitBalance',
  description:
    'Vrátí saldo jedné jednotky: zůstatek (záporný = dluh), nejstarší nezaplacený měsíc a ' +
    'jednotlivé pohyby. Použij, když řešíš konkrétní jednotku nebo plátce. ' +
    'Volitelné `asOf` omezí pohyby po tento den včetně.',
  input: z.object({ svjId: z.uuid(), unitId: z.uuid(), asOf: z.iso.date().optional() }),
  output: unitBalanceSchema,
  permission: 'finance.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) =>
    unitBalance(ctx, {
      svjId: svjIdSchema.parse(input.svjId),
      unitId: unitIdSchema.parse(input.unitId),
      asOf: input.asOf,
    }),
});
