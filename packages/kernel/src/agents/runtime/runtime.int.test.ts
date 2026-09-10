import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { agentRun } from '../../db/schema/index';
import { withTenant } from '../../db/tenant';
import {
  replayLlm,
  runAgentInTest,
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../testing/index';
import { clearTools } from '../../tools/registry/index';
import { clearAgents } from '../definition';
import { invoiceTriage, registerInvoiceTool, REPLAY_FIXTURE } from './agent.fixture';

const INVOICE_ID = '8f14e45f-ceea-467a-9f30-1b0e0b0e0001';

let database: TestDatabase;
let tenant: TestTenant;
const calls: string[] = [];

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
  clearTools();
  clearAgents();
  registerInvoiceTool(calls);
}, 120_000);

afterAll(async () => {
  await database.stop();
});

describe('runAgent in replay mode', () => {
  it('drives the tool loop from a fixture and records the run', async () => {
    const result = await runAgentInTest(
      tenant.ctx,
      invoiceTriage(),
      {
        kind: 'event',
        name: 'finance.invoice.needs_review',
        payload: { invoiceIds: [INVOICE_ID] },
      },
      { llm: replayLlm(REPLAY_FIXTURE), maxTurns: 4 },
    );

    expect(calls).toEqual([INVOICE_ID]);
    expect(result.status).toBe('succeeded');
    expect(result.result).toContain('1200');

    const rows = await withTenant(tenant.ctx, (tx) =>
      tx.select().from(agentRun).where(eq(agentRun.id, result.agentRunId)),
    );
    expect(rows[0]?.status).toBe('succeeded');
    expect(rows[0]?.outputTokens).toBeGreaterThan(0);
  }, 120_000);
});
