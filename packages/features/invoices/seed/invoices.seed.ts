import type { RequestContext } from '../../../kernel/src/context/index';
import { defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { readModels } from '../../svj/index';
import { seedBudget, seedContracts, seedSuppliers } from './catalogue';
import { seedScenarios } from './scenarios';
import { seedSpentBudget } from './spent';

interface House {
  readonly id: SvjId;
  readonly name: string;
}

/**
 * The houses in the order they were taken on, which is the order `seed/data/*` is written in. The
 * summaries come back by name, and a demonstration where the twelve-unit house got the eighty-unit
 * house's contracts would be confusing in a way nobody would spot from the screens.
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
 * The address book, the contracts and the budget of the three demo SVJ — and the five invoices the
 * demo can deliver on demand, written into object storage where the `demo` feature can find them.
 *
 * No invoice is delivered here. An invoice arrives because somebody sent it, and in the demo that
 * somebody is whoever clicks the button (task 019).
 */
export const invoicesSeed = defineSeed({
  name: 'invoices',
  dependsOn: ['svj'],
  run: async ({ ctx }: SeedContext): Promise<void> => {
    const year = new Date().getUTCFullYear();
    const suppliers = await seedSuppliers(ctx);
    const houses = await housesInSeedOrder(ctx);

    for (const [house, one] of houses.entries()) {
      await seedContracts(ctx, one.id, house, suppliers);
      await seedBudget(ctx, one.id, house, year);

      const roofer = suppliers.get('strechar');
      if (roofer !== undefined) {
        await seedSpentBudget(ctx, one.id, house, year, roofer, one.name);
      }
    }

    await seedScenarios(ctx, houses);
  },
});
