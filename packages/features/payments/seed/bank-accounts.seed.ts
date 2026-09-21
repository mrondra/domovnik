import type { RequestContext } from '../../../kernel/src/context/index';
import { defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import { SvjService, readModels } from '../../svj/index';
import { registerScenario } from '../../demo/index';
import { createBankAccount, listBankAccounts } from '../service/index';

const svj = new SvjService();

const FALLBACK = { number: '2800000000', bankCode: '2010' } as const;

/** `123456789/0800` is how a Czech account is written; the two halves are stored apart. */
const splitAccount = (value: string): { number: string; bankCode: string } => {
  const [number, bankCode] = value.split('/');
  return number === undefined || bankCode === undefined ? FALLBACK : { number, bankCode };
};

const MONTHS = 12;

const seedOne = async (
  ctx: RequestContext,
  svjId: Parameters<typeof listBankAccounts>[1],
  name: string,
): Promise<void> => {
  const existing = await listBankAccounts(ctx, svjId);
  const record = await svj.getById(ctx, svjId);
  const first = record.bankAccounts[0];
  if (first === undefined) return;

  const account =
    existing[0] ??
    (await createBankAccount(ctx, {
      svjId,
      ...splitAccount(first),
      label: 'Běžný účet SVJ',
      isPrimary: true,
    }));

  await registerScenario(ctx, {
    code: `bank-sync-${account.id}`,
    title: `Načíst výpis za rok — ${name}`,
    description:
      'Načte pohyby na účtu za posledních dvanáct měsíců a spáruje je s předpisy a fakturami. ' +
      'Co pravidla nerozhodnou — překlep ve variabilním symbolu, platba za dva měsíce naráz, ' +
      'nedoplatek — zůstane jako jedna dávka k posouzení.',
    kind: 'bank_sync',
    payload: { bankAccountId: account.id, svjId, months: MONTHS },
  });
};

/**
 * The account each SVJ already tells everybody to pay into — `svj.bankAccounts` is where it is
 * written down, and this is the row the statements are imported against (task 021).
 *
 * Idempotent by having any account at all: a house whose account somebody corrected during a
 * demonstration is left alone. The scenario row is upserted by its code, so improving its wording
 * updates it rather than adding a second one (docs/engineering.md §8).
 */
export const bankAccountsSeed = defineSeed({
  name: 'payments',
  dependsOn: ['svj'],
  run: async ({ ctx }: SeedContext): Promise<void> => {
    for (const summary of await readModels.svjSummary(ctx)) {
      await seedOne(ctx, summary.id, summary.name);
    }
  },
});
