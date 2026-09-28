import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError } from '../../../kernel/src/errors/index';
import { defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { findSupplierByIco } from '../../suppliers/index';
import { readModels } from '../../svj/index';
import { seedBudget } from './budget';
import { senderNamed } from './data/sender-catalogue';
import { seedScenarios } from './scenarios';
import { seedSpentBudget } from './spent';

interface House {
  readonly id: SvjId;
  readonly name: string;
}

/**
 * The houses in the order they were taken on, which is the order `seed/data/*` is written in. The
 * summaries come back by name, and a demonstration where the twelve-unit house got the eighty-unit
 * house's budget would be confusing in a way nobody would spot from the screens.
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
 * The budget of the three demo SVJ, and the five invoices the demo can deliver on demand, written
 * into object storage where the `demo` feature can find them. The address book and the contracts
 * are `suppliers`' own seed (task 029, ADR 0023) and run first because this seed depends on it.
 *
 * No invoice is delivered here. An invoice arrives because somebody sent it, and in the demo that
 * somebody is whoever clicks the button (task 019).
 */
defineSeed({
  name: 'invoices',
  dependsOn: ['suppliers', 'svj'],
  run: async ({ ctx }: SeedContext): Promise<void> => {
    const year = new Date().getUTCFullYear();
    const houses = await housesInSeedOrder(ctx);
    const rooferIco = senderNamed('strechar').ico;
    const roofer = await findSupplierByIco(ctx, rooferIco);
    if (roofer === null) {
      throw new DomainError('Seed nenašel dodavatele střechaře podle IČO z katalogu odesílatelů', {
        code: 'demo_sender_supplier_missing',
        details: { ico: rooferIco },
      });
    }

    for (const [house, one] of houses.entries()) {
      await seedBudget(ctx, one.id, house, year);
      await seedSpentBudget(ctx, one.id, house, year, roofer.id, one.name);
    }

    await seedScenarios(ctx, houses);
  },
});
