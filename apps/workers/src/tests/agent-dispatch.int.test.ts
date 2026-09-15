import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clearAgents } from '../../../../packages/kernel/src/agents/index';
import { agentRun } from '../../../../packages/kernel/src/db/schema/index';
import { withTenant } from '../../../../packages/kernel/src/db/index';
import {
  clearSubscriptions,
  createJobQueue,
  createOutboxRelay,
  createPgBossPublisher,
  defineEvent,
  events,
  startEventWorkers,
} from '../../../../packages/kernel/src/events/index';
import { clearTools } from '../../../../packages/kernel/src/tools/index';
import {
  applyTestEnv,
  replayLlm,
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../../packages/kernel/src/testing/index';
import {
  invoiceTriage,
  registerInvoiceTool,
  REPLAY_FIXTURE,
} from '../../../../packages/kernel/src/agents/runtime/agent.fixture';
import { createAgentRunner } from '../runtime/agent-runner';
import { subscribeAgents } from '../runtime/agent-subscriptions';
import { waitFor } from './queue.fixture';

const INVOICE_ID = '8f14e45f-ceea-467a-9f30-1b0e0b0e0001';
const needsReview = defineEvent('finance.invoice.needs_review', z.object({ invoiceIds: z.array(z.uuid()) }));

let database: TestDatabase;
let tenant: TestTenant;
let queue: Awaited<ReturnType<typeof createJobQueue>>;
let relay: ReturnType<typeof createOutboxRelay>;
const llm = replayLlm(REPLAY_FIXTURE);
const toolCalls: string[] = [];

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();

  clearTools();
  clearAgents();
  clearSubscriptions();
  registerInvoiceTool(toolCalls);
  invoiceTriage();

  applyTestEnv({ ANTHROPIC_BASE_URL: await llm.start(), ANTHROPIC_API_KEY: 'replay' });

  subscribeAgents(createAgentRunner());
  queue = await createJobQueue();
  await startEventWorkers(queue);
  relay = createOutboxRelay({ publisher: createPgBossPublisher(queue) });
}, 180_000);

afterAll(async () => {
  await queue.stop({ graceful: false });
  await llm.stop();
  clearSubscriptions();
  clearAgents();
  await database.stop();
});

const runsOfAgent = () =>
  withTenant(tenant.ctx, (tx) => tx.select().from(agentRun).where(eq(agentRun.status, 'succeeded')));

describe('an agent whose trigger fires', () => {
  it('is started by the dispatcher and leaves an agent_run with a trace', async () => {
    await withTenant(tenant.ctx, () =>
      events.emit(tenant.ctx, needsReview.create({ invoiceIds: [INVOICE_ID] })),
    );
    expect(await relay.publishPending()).toBe(1);

    await waitFor(async () => (await runsOfAgent()).length > 0, 120_000);

    const runs = await runsOfAgent();
    expect(runs).toHaveLength(1);
    expect(runs[0]?.traceId).not.toBeNull();
    expect(runs[0]?.trigger).toMatchObject({ kind: 'event', name: needsReview.name });
    expect(toolCalls).toEqual([INVOICE_ID]);
  }, 180_000);
});
