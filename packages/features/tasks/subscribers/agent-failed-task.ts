import { agentRunFailed } from '../../../kernel/src/agents/index';
import { subscribe } from '../../../kernel/src/events/index';
import { createTask } from '../service/create';

/**
 * A failed agent run is a thing for the administration to look at. The event carries no SVJ, so
 * the task belongs to none; `dedupeKey` makes a repeated delivery a no-op.
 */
export const raiseTaskForFailedAgent = subscribe(
  agentRunFailed.name,
  async (ctx, event) => {
    const payload = agentRunFailed.schema.parse(event.payload);

    await createTask(ctx, {
      title: `Agent ${payload.agentName} selhal`,
      description: `Agent ${payload.agentName}: ${payload.message}`,
      priority: payload.reason === 'failed_budget' ? 'high' : 'normal',
      departmentCode: 'administration',
      origin: { type: 'agent_run', id: payload.agentRunId },
      dedupeKey: `agent_run:${payload.agentRunId}`,
    });
  },
  { subscriber: 'tasks.agent-failed-task' },
);
