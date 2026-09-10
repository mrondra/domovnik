import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

describe('runAgent tool failures', () => {
  it('hands a tool failure back to the model instead of ending the run', async () => {
    const result = await runAgentInTest(
      tenant.ctx,
      invoiceTriage(),
      { kind: 'manual', name: 'rozbij-tool', payload: {} },
      { llm: replayLlm(REPLAY_FIXTURE), maxTurns: 4 },
    );

    expect(result.status).toBe('succeeded');
    expect(result.result).toContain('1200');
    expect(calls).toHaveLength(0);
  }, 120_000);
});
