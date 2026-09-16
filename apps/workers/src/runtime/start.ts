import { subscribeApprovalResume } from '../../../../packages/kernel/src/approvals/index';
import {
  createJobQueue,
  createOutboxRelay,
  createPgBossPublisher,
  startEventWorkers,
} from '../../../../packages/kernel/src/events/index';
import { logger } from '../../../../packages/kernel/src/logger/index';
import { createAgentRunner } from './agent-runner';
import { subscribeAgents } from './agent-subscriptions';
import { startRelayLoop, type RelayLoop } from './relay';
import { loadFeatureRegistry } from './registry';
import { startScheduler } from './scheduler';

export interface Runtime {
  stop(): Promise<void>;
}

/**
 * The whole worker process in one function: load what the features registered, decide who listens to
 * what, then open the queue. Subscriptions have to exist **before** `startEventWorkers`, because a
 * queue is created per subscription — one registered later has nothing draining it.
 *
 * That is why the registry comes first: a feature's `subscribers/*.ts` subscribe as they are
 * imported, and `startEventWorkers` then opens a queue for every registered subscription alike —
 * feature handler, agent trigger and approval resume.
 */
export const startRuntime = async (): Promise<Runtime> => {
  const registry = await loadFeatureRegistry();
  const runner = createAgentRunner();

  subscribeApprovalResume();
  const agentSubscriptions = subscribeAgents(runner);

  const queue = await createJobQueue();
  const workers = await startEventWorkers(queue);
  const schedules = await startScheduler(queue, runner);

  const relay: RelayLoop = startRelayLoop(createOutboxRelay({ publisher: createPgBossPublisher(queue) }));

  logger().info(
    { ...registry, agentSubscriptions: agentSubscriptions.length, queues: workers.length, schedules },
    'Workers running',
  );

  return {
    stop: async () => {
      await relay.stop();
      await queue.stop({ graceful: true });
      logger().info('Workers stopped');
    },
  };
};
