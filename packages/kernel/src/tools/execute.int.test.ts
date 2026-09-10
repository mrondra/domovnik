import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { approval } from '../db/schema/index';
import { withTenant } from '../db/tenant';
import type { ApprovalId } from '../ids/index';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { defineTool } from './registry/index';
import { clearTools } from './registry/index';
import { executeTool } from './execute';

let database: TestDatabase;
let tenant: TestTenant;
let calls: string[];

const paymentInput = z.object({ amount: z.number() });

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
    input: paymentInput,
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
  defineTool({
    name: 'invoice.get',
    description: 'Vrátí fakturu.',
    input: z.object({ invoiceId: z.string() }),
    output: z.object({ total: z.number() }),
    permission: 'finance.read',
    approval: () => ({ required: false, approvers: [] }),
    userComposable: true,
    readOnly: true,
    handler: () => {
      calls.push('invoice.get');
      return Promise.resolve({ total: 100 });
    },
  });
});

const requestPayment = async (): Promise<ApprovalId> => {
  const execution = await executeTool(tenant.ctx, 'payment.createOrder', { amount: 1200 });
  if (execution.status !== 'pending_approval') throw new TypeError('expected pending_approval');
  return execution.approvalId;
};

describe('executeTool', () => {
  it('defers a tool whose policy requires approval instead of running it', async () => {
    const approvalId = await requestPayment();

    expect(calls).toEqual([]);
    const rows = await withTenant(tenant.ctx, (tx) =>
      tx.select().from(approval).where(eq(approval.id, approvalId)),
    );
    expect(rows[0]?.status).toBe('pending');
  });

  it('runs a tool that needs no approval', async () => {
    const execution = await executeTool(tenant.ctx, 'invoice.get', { invoiceId: 'x' });
    expect(execution).toEqual({ status: 'ok', output: { total: 100 } });
  });

  it('rejects an actor without the required permission', async () => {
    const outsider = {
      ...tenant.ctx,
      actor: { type: 'user' as const, id: tenant.adminId, roles: ['owner' as const] },
    };
    await expect(executeTool(outsider, 'payment.createOrder', { amount: 1 })).rejects.toThrow(
      /oprávnění finance.pay/,
    );
  });

  it('rejects input that does not match the schema', async () => {
    await expect(executeTool(tenant.ctx, 'invoice.get', { invoiceId: 42 })).rejects.toThrow(/Neplatný vstup/);
  });
});
