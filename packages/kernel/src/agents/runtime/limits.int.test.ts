import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { agentConfig, event as eventTable } from '../../db/schema/index';
import { withTenant } from '../../db/tenant';
import { newRowId } from '../../ids/index';
import {
  replayLlm,
  runAgentInTest,
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../testing/index';
import { clearTools, defineTool } from '../../tools/registry/index';
import { clearAgents, defineAgent } from '../definition';
import { invoiceTriage, registerInvoiceTool, REPLAY_FIXTURE } from './agent.fixture';

let database: TestDatabase;
let tenant: TestTenant;
const calls: string[] = [];

const manualTrigger = { kind: 'manual', name: 'manual', payload: {} } as const;

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

describe('runAgent limits', () => {
  it('stops on the token budget and reports it as a failed run', async () => {
    const result = await runAgentInTest(tenant.ctx, invoiceTriage(), manualTrigger, {
      llm: replayLlm(REPLAY_FIXTURE),
      maxTurns: 4,
      tokenBudget: 1,
    });

    expect(result.status).toBe('failed_budget');

    const events = await withTenant(tenant.ctx, (tx) =>
      tx.select().from(eventTable).where(eq(eventTable.name, 'agent.run.failed')),
    );
    expect(events.length).toBeGreaterThan(0);
  }, 120_000);

  it('refuses to run an agent switched off for the tenant', async () => {
    const other = await withTestTenant('Vypnuto');
    await withTenant(other.ctx, async (tx) => {
      await tx.insert(agentConfig).values({
        id: newRowId(),
        tenantId: other.tenantId,
        agentName: 'invoice-triage',
        isEnabled: false,
      });
    });

    await expect(
      runAgentInTest(other.ctx, invoiceTriage(), manualTrigger, {
        llm: replayLlm(REPLAY_FIXTURE),
      }),
    ).rejects.toThrow(/vypnutý/);
  });

  it('refuses an agent whose tool does not take an object', async () => {
    defineTool({
      name: 'invoice.note',
      description: 'Poznámka k faktuře.',
      input: z.string(),
      output: z.object({ ok: z.boolean() }),
      permission: 'finance.read',
      approval: () => ({ required: false, approvers: [] }),
      userComposable: false,
      readOnly: true,
      handler: () => Promise.resolve({ ok: true }),
    });

    await expect(
      runAgentInTest(
        tenant.ctx,
        defineAgent({ ...invoiceTriage(), name: 'note-agent', tools: ['invoice.note'] }),
        manualTrigger,
        { llm: replayLlm(REPLAY_FIXTURE) },
      ),
    ).rejects.toThrow(/objektový vstup/);
  });
});
