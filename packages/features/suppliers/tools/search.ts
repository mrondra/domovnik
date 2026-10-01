import { z } from 'zod';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { supplierSchema } from '../domain/schemas';
import { specializationSchema } from '../domain/specializations';
import { searchSuppliers } from '../service/index';

/**
 * Defining the tool registers it; `loadToolsFrom` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6). The address book is shared by every SVJ, so this asks no reach question —
 * a supplier belongs to the management company, not to one house (task 030).
 */
export const suppliersSearch = defineTool({
  name: 'suppliers.search',
  description:
    'Najde dodavatele podle oboru a/nebo části jména, jen aktivní. Použij, když hledáš firmu, ' +
    'která umí konkrétní obor (např. revize_elektro), nebo si nejsi jistý přesným názvem.',
  input: z.object({
    specialization: specializationSchema.optional(),
    text: z.string().min(1).optional(),
  }),
  output: z.array(supplierSchema).readonly(),
  permission: 'suppliers.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) => searchSuppliers(ctx, { specialization: input.specialization, text: input.text }),
});
