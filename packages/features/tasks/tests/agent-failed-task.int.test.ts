import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { agentRunFailed } from '../../../kernel/src/agents/index';
import { createContext, type RequestContext } from '../../../kernel/src/context/index';
import { eventIdSchema, newId, tenantIdSchema } from '../../../kernel/src/ids/index';
import { SvjService } from '../../svj/index';
import { raiseTaskForFailedAgent } from '../subscribers/agent-failed-task';
import { rowsOf } from './mutations.fixture';
import { startTasksDb, withTestTenant, type TestDatabase, type TestTenant } from './tasks.fixture';

let database: TestDatabase;
let tenant: TestTenant;
let delivery: RequestContext;
let departmentId: string;

beforeAll(async () => {
  database = await startTasksDb();
  tenant = await withTestTenant();
  departmentId = (
    await new SvjService().createDepartment(tenant.ctx, { code: 'administration', name: 'Správa' })
  ).id;
  delivery = createContext({
    tenantId: tenant.tenantId,
    actor: { type: 'system', id: null, roles: [] },
  });
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const fail = (
  agentRunId: string,
  reason: 'failed' | 'failed_budget',
  eventId = newId(eventIdSchema),
): Promise<void> =>
  raiseTaskForFailedAgent.handler(delivery, {
    eventId,
    name: agentRunFailed.name,
    version: 1,
    payload: { agentName: 'invoice-agent', agentRunId, reason, message: 'Rozpočet vyčerpán' },
    tenantId: tenantIdSchema.parse(tenant.tenantId),
    correlationId: delivery.correlationId,
  });

const tasksOf = async (agentRunId: string) =>
  (await rowsOf(tenant.ctx)).tasks.filter((one) => one.dedupeKey === `agent_run:${agentRunId}`);

describe('tasks.agent-failed-task', () => {
  it('raises a high priority task for the administration when the budget ran out', async () => {
    const runId = crypto.randomUUID();
    await fail(runId, 'failed_budget');

    const [found, ...rest] = await tasksOf(runId);
    expect(rest).toEqual([]);
    expect(found).toMatchObject({
      priority: 'high',
      departmentId,
      svjId: null,
      originType: 'agent_run',
      originId: runId,
    });
    expect(found?.description).toContain('invoice-agent');
    expect(found?.description).toContain('Rozpočet vyčerpán');
  });

  it('raises a normal priority task for any other failure', async () => {
    const runId = crypto.randomUUID();
    await fail(runId, 'failed');

    expect((await tasksOf(runId)).map((one) => one.priority)).toEqual(['normal']);
  });

  it('raises one task however many times the event is delivered', async () => {
    const runId = crypto.randomUUID();
    await fail(runId, 'failed');
    await fail(runId, 'failed');

    expect(await tasksOf(runId)).toHaveLength(1);
  });
});
