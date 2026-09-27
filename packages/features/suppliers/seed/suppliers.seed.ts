import type { RequestContext } from '../../../kernel/src/context/index';
import { defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { readModels } from '../../svj/index';
import { seedContracts, seedSuppliers } from './catalogue';

interface House {
  readonly id: SvjId;
  readonly name: string;
}

/**
 * The houses in the order they were taken on, which is the order `seed/data/contracts.ts` is
 * written in. The summaries come back by name, and a demonstration where the twelve-unit house got
 * the eighty-unit house's contracts would be confusing in a way nobody would spot from the screens.
 */
const housesInSeedOrder = async (ctx: RequestContext): Promise<readonly House[]> => {
  const summaries = await readModels.svjSummary(ctx);
  const sequenced = await Promise.all(
    summaries.map(async (one) => ({
      id: one.id,
      name: one.name,
      sequence: await readModels.svjSequence(ctx, one.id),
    })),
  );
  return [...sequenced].sort((left, right) => left.sequence - right.sequence);
};

/**
 * The address book and the contracts of the three demo SVJ (task 029, moved out of `invoices` so
 * `inspections` and `quotes` can use the same address book without depending on the whole feature).
 */
export const suppliersSeed = defineSeed({
  name: 'suppliers',
  dependsOn: ['svj'],
  run: async ({ ctx }: SeedContext): Promise<void> => {
    const suppliers = await seedSuppliers(ctx);
    const houses = await housesInSeedOrder(ctx);

    for (const [house, one] of houses.entries()) {
      await seedContracts(ctx, one.id, house, suppliers);
    }
  },
});
