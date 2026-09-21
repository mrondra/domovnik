import { defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import { SvjService, readModels } from '../../svj/index';
import { linkOf, linkSvj } from '../service/index';

const svj = new SvjService();

/**
 * Every demo house is its own accounting unit (zadání kap. 4), served by the Pohoda the demo runs
 * on. Idempotent by having a link at all: a house somebody repointed during a demonstration is
 * left as they left it.
 */
export const accountingLinksSeed = defineSeed({
  name: 'accounting-sync',
  dependsOn: ['svj'],
  run: async ({ ctx }: SeedContext): Promise<void> => {
    for (const summary of await readModels.svjSummary(ctx)) {
      if ((await linkOf(ctx, summary.id)) !== null) continue;

      const record = await svj.getById(ctx, summary.id);
      await linkSvj(ctx, { svjId: summary.id, companyIco: record.ico });
    }
  },
});
