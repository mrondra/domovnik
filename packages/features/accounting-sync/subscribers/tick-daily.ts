import { dailyTick, subscribe } from '../../../kernel/src/events/index';
import { logger } from '../../../kernel/src/logger/index';
import { detectAcrossTenant } from '../service/index';

/**
 * Once a day, every linked house is read back out of the accounting and the differences are
 * written down (zadání §5). Time is an event, so this carries no cron of its own.
 *
 * Delivery is at-least-once and the sweep is a read: a second delivery finds the conflicts it
 * would open already open, and opens nothing.
 */
export const compareWithAccounting = subscribe(
  dailyTick.name,
  async (ctx) => {
    const opened = await detectAcrossTenant(ctx);
    logger().info({ opened }, 'Denní porovnání s účetnictvím hotové');
  },
  { subscriber: 'accounting-sync.tick-daily' },
);
