import { z } from 'zod';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { contractSchema, supplierSchema } from '../domain/schemas';
import { specializationSchema } from '../domain/specializations';
import { contractedSupplierFor } from '../service/index';

/**
 * Defining the tool registers it; `loadToolsFrom` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6). This is what `inspections` (task 037) and `quotes` ask instead of walking a
 * list of contracts themselves — "does this SVJ have a contracted firm for this obor, today".
 */
export const suppliersContractFor = defineTool({
  name: 'suppliers.contractFor',
  description:
    'Zjistí, jestli má SVJ platnou smlouvu pokrývající daný obor, a pokud ano, vrátí dodavatele ' +
    'i smlouvu. Použij před revizí nebo poptávkou, abys věděl, jestli SVJ firmu na tento obor už ' +
    'má. `null` znamená, že žádná platná smlouva ten obor nepokrývá.',
  input: z.object({ svjId: z.uuid(), specialization: specializationSchema }),
  output: z.object({ supplier: supplierSchema, contract: contractSchema }).nullable(),
  permission: 'suppliers.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) =>
    contractedSupplierFor(ctx, {
      svjId: svjIdSchema.parse(input.svjId),
      specialization: input.specialization,
      on: new Date(),
    }),
});
