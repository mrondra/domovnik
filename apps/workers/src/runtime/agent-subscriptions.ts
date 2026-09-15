import { registeredAgents } from '../../../../packages/kernel/src/agents/index';
import {
  agentLimits,
  events,
  type DeliveredEvent,
  type Subscription,
} from '../../../../packages/kernel/src/events/index';
import type { AgentRunner } from './agent-runner';

/** The subscriber becomes a queue name, so it stays inside what pg-boss accepts. */
const subscriberFor = (agentName: string): string => `agent.${agentName}`;

/**
 * Agents are subscribers like any other, so they ride the same outbox → queue path and inherit its
 * idempotency: the job id is derived from `eventId` and the queue name, which already carries the
 * subscriber. A redelivered event therefore cannot start the same agent twice.
 *
 * One subscription per trigger, not per agent, because the queue name has to name the event it
 * drains — an agent listening to two events needs two queues or one blocks the other.
 */
export const subscribeAgents = (runner: AgentRunner): readonly Subscription[] => {
  const { perAgent } = agentLimits();

  return registeredAgents().flatMap((definition) =>
    definition.triggers.map((trigger) =>
      events.subscribe(
        trigger.event,
        (ctx, event: DeliveredEvent) =>
          runner(ctx, definition, {
            kind: 'event',
            name: event.name,
            payload: event.payload,
            eventId: event.eventId,
          }),
        { subscriber: subscriberFor(definition.name), concurrency: perAgent },
      ),
    ),
  );
};
