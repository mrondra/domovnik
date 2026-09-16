import { z } from 'zod';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { unitSchema } from '../domain/schemas';
import { listUnits } from '../service/index';

export const svjListUnits = defineTool({
  name: 'svj.listUnits',
  description:
    'Vypíše jednotky jednoho SVJ: číslo, typ (byt/nebytový prostor/garáž), podíl na společných ' +
    'částech jako zlomek a podlahovou plochu v m². Použij pro výpočty podílů a přehledy jednotek.',
  input: z.object({ svjId: z.uuid() }),
  output: z.array(unitSchema).readonly(),
  permission: 'svj.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) => listUnits(ctx, svjIdSchema.parse(input.svjId)),
});
