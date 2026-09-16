import { z } from 'zod';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { svjSchema } from '../domain/schemas';
import { getSvjById } from '../service/index';

/**
 * Defining the tool registers it; `loadToolsFrom` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6).
 */
export const svjGet = defineTool({
  name: 'svj.get',
  description:
    'Vrátí základní údaje jednoho SVJ: název, IČO, adresu, členy výboru a bankovní účty. ' +
    'Použij, když už znáš id SVJ a potřebuješ jeho kmenové údaje. ' +
    'SVJ mimo rozsah přihlášení se chová, jako by neexistovalo.',
  input: z.object({ svjId: z.uuid() }),
  output: svjSchema,
  permission: 'svj.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) => getSvjById(ctx, svjIdSchema.parse(input.svjId)),
});
