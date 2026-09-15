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

describe('a tool whose policy requires approval', () => {
  it('never reaches its handler on the way in', async () => {
    await requestPayment();
    expect(calls).toEqual([]);
  });

  it('is still not run by the decision itself', async () => {
    const approvalId = await requestPayment();

    expect(await approvals.decide(tenant.ctx, approvalId, 'approved')).toEqual({ status: 'approved' });

    // The decision only releases the action; the workers carry it out (ADR 0015).
    expect(calls).toEqual([]);
    expect((await approvals.get(tenant.ctx, approvalId)).executedAt).toBeNull();
  });

  it('refuses a second decision on the same approval', async () => {
    const approvalId = await requestPayment();

    await approvals.decide(tenant.ctx, approvalId, 'approved');

    await expect(approvals.decide(tenant.ctx, approvalId, 'approved')).rejects.toThrow(/už bylo rozhodnuto/);
  });

  it('is never run for a rejected approval', async () => {
    const approvalId = await requestPayment();

    expect(await approvals.decide(tenant.ctx, approvalId, 'rejected', 'mimo rozpočet')).toEqual({
      status: 'rejected',
    });
    expect(await approvals.resume(tenant.ctx, approvalId)).toBe(false);
    expect(calls).toEqual([]);
  });
});
