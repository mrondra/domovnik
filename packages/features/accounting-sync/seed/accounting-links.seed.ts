import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import { registerScenario } from '../../demo/index';
import { SvjService, readModels } from '../../svj/index';
import { linkOf, linkSvj } from '../service/index';

const svj = new SvjService();

/** The demo's statements come out of Pohoda, the way they will in production (zadání kap. 8). */
const CONFIG = { bankSource: 'pohoda' } as const;

const CHANGE = -1200;

const offerMutation = (ctx: RequestContext, svjId: SvjId, name: string): Promise<void> =>
  registerScenario(ctx, {
    code: `pohoda-mutation-${svjId}`,
    title: `Účetní změnila částku faktury v Pohodě — ${name}`,
    description:
      'Sníží v účetnictví částku jedné zapsané faktury, jako by ji tam někdo opravil podle ' +
      'papírového dokladu. Denní porovnání rozdíl najde, založí konflikt a nechá o něm rozhodnout ' +
      'účetní — nic se nepřepisuje.',
    kind: 'pohoda_mutation',
    payload: { svjId, amountChange: CHANGE },
  });

/**
 * Where a house is booked stays as somebody left it; a setting that did not exist when the link
 * was made is filled in. The two are different things: repointing an SVJ is a decision, having no
 * opinion about where its statements come from is not.
 */
const linkOne = async (ctx: RequestContext, svjId: SvjId): Promise<void> => {
  const link = await linkOf(ctx, svjId);
  if (link === null) {
    const record = await svj.getById(ctx, svjId);
    await linkSvj(ctx, { svjId, companyIco: record.ico, config: CONFIG });
    return;
  }

  if (link.config?.['bankSource'] === undefined) {
    await linkSvj(ctx, {
      svjId,
      companyIco: link.companyIco,
      accountingAdapter: link.accountingAdapter,
      receivablesAdapter: link.receivablesAdapter,
      config: { ...link.config, ...CONFIG },
    });
  }
};

/**
 * Every demo house is its own accounting unit (zadání kap. 4), served by the Pohoda the demo runs
 * on, and every one of them can show what happens when the accountant edits an invoice there. The
 * scenario row is upserted by its code, so improving its wording updates it (docs/engineering.md §8).
 */
export const accountingLinksSeed = defineSeed({
  name: 'accounting-sync',
  dependsOn: ['svj'],
  run: async ({ ctx }: SeedContext): Promise<void> => {
    for (const summary of await readModels.svjSummary(ctx)) {
      await linkOne(ctx, summary.id);
      await offerMutation(ctx, summary.id, summary.name);
    }
  },
});
