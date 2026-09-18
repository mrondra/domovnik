import { defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import { readModels } from '../../svj/index';
import { generatePrescriptions } from '../service/index';
import { DEMO_PLAN, monthsUpTo } from './plan';

/**
 * Twelve months of prescriptions for every seeded SVJ. Idempotent because
 * `generatePrescriptions` is: the unique index on `(tenant, svj, unit, year, month)` is what makes
 * a second run add nothing, so this seed needs no key of its own (docs/engineering.md §8).
 *
 * No payments — those arrive with the bank generator in task 021, so that a balance is the result
 * of movements rather than something the seed wrote down.
 */
export const receivablesSeed = defineSeed({
  name: 'receivables',
  dependsOn: ['svj'],
  run: async ({ ctx }: SeedContext): Promise<void> => {
    const periods = monthsUpTo(new Date());

    for (const summary of await readModels.svjSummary(ctx)) {
      for (const period of periods) {
        await generatePrescriptions(ctx, { svjId: summary.id, period, plan: DEMO_PLAN });
      }
    }
  },
});
