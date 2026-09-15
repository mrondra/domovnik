import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auditLog } from '../db/schema/index';
import { withTenant } from '../db/tenant';
import { clearSubscriptions, deliveryContext, type DeliveredEvent } from '../events/index';
import type { ApprovalId, EventId } from '../ids/index';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { executeTool } from '../tools/execute';
import { clearTools, defineTool } from '../tools/registry/index';
import { approvalDecided } from './events';
import { approvals, subscribeApprovalResume } from './index';

let database: TestDatabase;
let tenant: TestTenant;
let seenBy: string[];

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  clearSubscriptions();
  await database.stop();
});

beforeEach(() => {
  clearTools();
  seenBy = [];
  defineTool({
    name: 'payment.createOrder',
    description: 'Vytvoří příkaz k úhradě z účtu SVJ.',
    input: z.object({ amount: z.number() }),
    output: z.object({ orderId: z.string() }),
    permission: 'finance.pay',
    approval: () => ({ required: true, approvers: [] }),
    userComposable: false,
    readOnly: false,
    handler: (ctx) => {
      seenBy.push(`${ctx.actor.type}:${ctx.actor.id ?? ''}`);
      return Promise.resolve({ orderId: 'order-1' });
    },
  });
});

const approvedPayment = async (): Promise<ApprovalId> => {
  const execution = await executeTool(tenant.ctx, 'payment.createOrder', { amount: 1200 });
  if (execution.status !== 'pending_approval') throw new TypeError('expected pending_approval');
  await approvals.decide(tenant.ctx, execution.approvalId, 'approved');
  return execution.approvalId;
};

describe('approvals.resume', () => {
  it('runs the deferred handler and records that it ran', async () => {
    const id = await approvedPayment();

    expect(await approvals.resume(tenant.ctx, id)).toBe(true);

    const detail = await approvals.get(tenant.ctx, id);
    expect(detail.result).toEqual({ orderId: 'order-1' });
    expect(detail.executedAt).not.toBeNull();
  });

  it('runs the handler as the person who approved it, not as system', async () => {
    const id = await approvedPayment();
    await approvals.resume(tenant.ctx, id);

    expect(seenBy).toEqual([`user:${tenant.adminId}`]);
  });

  it('does nothing on a redelivered decision', async () => {
    const id = await approvedPayment();

    expect(await approvals.resume(tenant.ctx, id)).toBe(true);
    expect(await approvals.resume(tenant.ctx, id)).toBe(false);
    expect(seenBy).toHaveLength(1);
  });

  it('leaves an audit row naming the executed tool', async () => {
    const id = await approvedPayment();
    await approvals.resume(tenant.ctx, id);

    const rows = await withTenant(tenant.ctx, (tx) =>
      tx.select().from(auditLog).where(eq(auditLog.entityId, id)),
    );
    expect(rows.map((row) => row.action)).toContain('approval.executed');
  });
});

describe('the approval-resume subscription', () => {
  it('carries a decision from the event to the handler', async () => {
    clearSubscriptions();
    const subscription = subscribeApprovalResume();
    const id = await approvedPayment();

    const delivered: DeliveredEvent = {
      eventId: crypto.randomUUID() as EventId,
      name: approvalDecided.name,
      version: 1,
      payload: { approvalId: id, toolName: 'payment.createOrder', decision: 'approved', decidedBy: null },
      tenantId: tenant.tenantId,
      correlationId: 'resume-test',
    };
    await subscription.handler(deliveryContext(delivered), delivered);

    expect((await approvals.get(tenant.ctx, id)).executedAt).not.toBeNull();
  });
});
