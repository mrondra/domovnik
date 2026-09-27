import { defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import { registerScenario } from '../service/index';

/**
 * The one scenario `demo` offers about itself: firing the daily watch on demand, so a
 * demonstration does not have to wait for the real midnight tick (038, 052).
 */
export const dailyTickSeed = defineSeed({
  name: 'demo',
  run: async ({ ctx }: SeedContext): Promise<void> => {
    await registerScenario(ctx, {
      code: 'daily-tick',
      title: 'Spustit ranní kontrolu termínů',
      description:
        'Vyvolá denní hlídání, jako by nastala půlnoc: porovnání s účetnictvím a další denní ' +
        'kontroly proběhnou hned, místo aby se čekalo na skutečnou půlnoc.',
      kind: 'daily_tick',
      payload: {},
    });
  },
});
