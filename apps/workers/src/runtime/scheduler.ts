import { dailyTick, monthlyTick } from '../../../../packages/kernel/src/events/index';
import { logger } from '../../../../packages/kernel/src/logger/index';
import type { AgentRunner } from './agent-runner';
import { runAgentForEveryTenant, scheduledAgents } from './scheduled-agents';
import { emitTickForEveryTenant, expireOverdueApprovals, type Tick } from './ticks';

/** Morning of the working day, and the first of the month — the rhythm a správce actually works in. */
const DAILY_CRON = '0 6 * * *';
const MONTHLY_CRON = '0 6 1 * *';
const TIMEZONE = 'Europe/Prague';

const SCHEDULE_PREFIX = 'agent-schedule';

/** The slice of pg-boss the scheduler needs; the real queue satisfies it. */
export interface CronQueue {
  createQueue(name: string): Promise<void>;
  schedule(name: string, cron: string, data?: object | null, options?: { tz?: string }): Promise<void>;
  work(
    name: string,
    options: { batchSize: number },
    handler: (jobs: readonly unknown[]) => Promise<unknown>,
  ): Promise<string>;
}

const register = async (
  queue: CronQueue,
  name: string,
  cron: string,
  job: () => Promise<void>,
): Promise<string> => {
  await queue.createQueue(name);
  await queue.schedule(name, cron, {}, { tz: TIMEZONE });
  await queue.work(name, { batchSize: 1 }, job);
  return name;
};

const tickJob = (tick: Tick) => async (): Promise<void> => {
  const tenants = await emitTickForEveryTenant(tick, new Date());
  logger().info({ tick: tick.name, tenants }, 'Tick emitted');
};

const dailyJob = async (): Promise<void> => {
  await tickJob(dailyTick)();
  logger().info({ expired: await expireOverdueApprovals() }, 'Overdue approvals expired');
};

/**
 * Two kinds of cron: the ticks, which become ordinary events so an agent subscribes to time the same
 * way it subscribes to anything else (zadání §5), and the `schedule` an agent definition carries on
 * its own, which starts that one agent. Both fan out per tenant — pg-boss has no idea tenants exist.
 */
export const startScheduler = async (queue: CronQueue, runner: AgentRunner): Promise<readonly string[]> =>
  Promise.all([
    register(queue, dailyTick.name, DAILY_CRON, dailyJob),
    register(queue, monthlyTick.name, MONTHLY_CRON, tickJob(monthlyTick)),
    ...scheduledAgents().map((agent) =>
      register(queue, `${SCHEDULE_PREFIX}:${agent.definition.name}`, agent.cron, () =>
        runAgentForEveryTenant(runner, agent.definition),
      ),
    ),
  ]);
