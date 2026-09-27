import { z } from 'zod';
import { dailyTick, events } from '../../../kernel/src/events/index';
import { defineScenarioKind } from '../domain/definition';
import type { ScenarioResult } from '../domain/types';

/** The start of today, in UTC — the same `at` a real midnight firing would carry (kernel `dailyTick`). */
const startOfToday = (now = new Date()): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

/**
 * Time as a button: every daily watch a real tenant only sees once a night can be fired on demand,
 * so a demonstration does not have to wait for midnight (038, 052). `demo` is the feature here —
 * the tick is the kernel's own, not another feature's business.
 */
export const dailyTickScenario = defineScenarioKind({
  kind: 'daily_tick',
  feature: 'demo',
  payload: z.object({}),
  run: async (ctx, code): Promise<ScenarioResult> => {
    await events.emit(ctx, dailyTick.create({ at: startOfToday().toISOString() }));

    return {
      code,
      outcome: 'started',
      message: 'Denní hlídání spuštěno; výsledky se objeví u toho, co našly.',
      link: null,
    };
  },
});
