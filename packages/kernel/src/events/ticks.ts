import { z } from 'zod';
import { defineEvent } from './definition';

/** `at` is the start of the period the tick stands for, so a handler never has to read the clock. */
const tickPayload = z.object({ at: z.iso.datetime() });

/**
 * Time as an event. The scheduler in `apps/workers` emits these for every active tenant, so an agent
 * that has to run periodically subscribes to a tick instead of carrying a cron of its own
 * (zadání §5).
 */
export const dailyTick = defineEvent('tick.daily', tickPayload);

export const monthlyTick = defineEvent('tick.monthly', tickPayload);
