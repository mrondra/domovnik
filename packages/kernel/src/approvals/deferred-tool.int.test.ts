import { z } from 'zod';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { ApprovalId } from '../ids/index';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { executeTool } from '../tools/execute';
import { clearTools, defineTool } from '../tools/registry/index';
import { approvals } from './index';

let database: TestDatabase;
let tenant: TestTenant;
let calls: string[];

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

beforeEach(() => {
  clearTools();
  calls = [];
  defineTool({
    name: 'payment.createOrder',
    description: 'Vytvoří příkaz k úhradě z účtu SVJ.',
    input: z.object({ amount: z.number() }),
    output: z.object({ orderId: z.string() }),
    permission: 'finance.pay',
    approval: () => ({ required: true, approvers: [] }),
    userComposable: false,
    readOnly: false,
    handler: (_ctx, input) => {
      calls.push(`order:${String(input.amount)}`);
      return Promise.resolve({ orderId: 'order-1' });
    },
  });
});

const requestPayment = async (): Promise<ApprovalId> => {
  const execution = await executeTool(tenant.ctx, 'payment.createOrder', { amount: 1200 });
  if (execution.status !== 'pending_approval') throw new TypeError('expected pending_approval');
  return execution.approvalId;
};

describe('approvals.decide', () => {
  it('runs the deferred handler exactly once', async () => {
    const approvalId = await requestPayment();

    const decision = await approvals.decide(tenant.ctx, approvalId, 'approved');

    expect(decision.output).toEqual({ orderId: 'order-1' });
    expect(calls).toEqual(['order:1200']);
    await expect(approvals.decide(tenant.ctx, approvalId, 'approved')).rejects.toThrow(/už bylo rozhodnuto/);
    expect(calls).toEqual(['order:1200']);
  });

  it('never runs the handler for a rejected approval', async () => {
    const approvalId = await requestPayment();
    const decision = await approvals.decide(tenant.ctx, approvalId, 'rejected', 'mimo rozpočet');
    expect(decision).toEqual({ status: 'rejected' });
    expect(calls).toEqual([]);
  });
});
