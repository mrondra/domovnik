import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { reachableSvj } from '../../../kernel/src/identity/index';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { supplierIdSchema } from '../domain/ids';
import { contractSchema, supplierSchema } from '../domain/schemas';
import { contract } from '../schema';
import { supplierById } from '../service/index';
import { toContract } from '../service/rows';

/**
 * Defining the tool registers it; `loadToolsFrom` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6). A supplier itself is shared by every SVJ (task 030), but the contracts it
 * comes back with are not: a committee member of SVJ A must not learn that this dodavatel also
 * serves SVJ B, so the contract list is filtered to `reachableSvj`, the same scope every other
 * SVJ-naming read in this feature respects (`../service/reach.ts`).
 */
export const suppliersGet = defineTool({
  name: 'suppliers.get',
  description:
    'Vrátí jednoho dodavatele (obory, kontakty) a smlouvy, které s ním mají SVJ v dosahu aktéra. ' +
    'Smlouvy jiného SVJ v odpovědi nejsou, i kdyby existovaly. Použij, když znáš id dodavatele.',
  input: z.object({ supplierId: z.uuid() }),
  output: z.object({ supplier: supplierSchema, contracts: z.array(contractSchema).readonly() }),
  permission: 'suppliers.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: async (ctx, input) => {
    const supplierId = supplierIdSchema.parse(input.supplierId);
    const found = await supplierById(ctx, supplierId);
    if (found === null) {
      throw new NotFoundError('Dodavatel nenalezen', {
        code: 'supplier_not_found',
        details: { supplierId },
      });
    }

    const allowed = await reachableSvj(ctx);
    const contracts = await withTenant(ctx, async (tx) => {
      const rows = await tx
        .select()
        .from(contract)
        .where(
          allowed === null
            ? eq(contract.supplierId, supplierId)
            : and(eq(contract.supplierId, supplierId), inArray(contract.svjId, [...allowed])),
        );
      return rows.map(toContract);
    });

    return { supplier: found, contracts };
  },
});
