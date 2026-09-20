import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { approvals } from '../../../kernel/src/approvals/index';
import { withTenant } from '../../../kernel/src/db/index';
import { approvalIdSchema, type ApprovalId } from '../../../kernel/src/ids/index';
import { executeTool } from '../../../kernel/src/tools/index';
import { getInvoice } from '../service/index';
import { invoiceApprove } from '../tools/approve';
import { onApprovalRejected } from '../subscribers/on-approval-rejected';
import { approvalDecided } from '../../../kernel/src/approvals/index';
import { eventIdSchema, newId, tenantIdSchema } from '../../../kernel/src/ids/index';
import { readyForApproval, type ReadyForApproval } from './approval.fixture';
import { useRecordedLlm } from './extraction.fixture';
import { startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

const PROPOSAL = {
  summary: 'Úklid společných prostor za září 2026, 15 000 Kč, stejně jako každý měsíc.',
  recommendation: 'approve' as const,
  risks: [] as readonly string[],
};

let world: InvoicesWorld;
let ctx: RequestContext;

const propose = async (ready: ReadyForApproval): Promise<ApprovalId> => {
  const execution = await executeTool(ctx, invoiceApprove.name, {
    ...PROPOSAL,
    invoiceId: ready.invoiceId,
  });
  if (execution.status !== 'pending_approval') throw new TypeError(execution.status);
  return execution.approvalId;
};

/** What `apps/workers` does when the decision arrives: the kernel resumes, the feature listens. */
const deliverDecision = (approvalId: ApprovalId, decision: 'approved' | 'rejected'): Promise<void> =>
  withTenant(ctx, async () => {
    await approvals.resume(ctx, approvalId);
    await onApprovalRejected.handler(ctx, {
      eventId: newId(eventIdSchema),
      name: approvalDecided.name,
      version: approvalDecided.version,
      payload: {
        approvalId,
        toolName: invoiceApprove.name,
        decision,
        decidedBy: null,
      },
      tenantId: tenantIdSchema.parse(ctx.tenantId),
      correlationId: ctx.correlationId,
    });
  });

beforeAll(async () => {
  world = await startInvoicesWorld();
  useRecordedLlm();
  ctx = (await withTestTenant()).ctx;
}, 300_000);

afterAll(async () => {
  await world.stop();
});

describe('invoice.approve', () => {
  it('asks the committee of that SVJ and parks the invoice, approving nothing', async () => {
    const ready = await readyForApproval(ctx, 'as-agreed');

    const approvalId = await propose(ready);
    const approval = await approvals.get(ctx, approvalIdSchema.parse(approvalId));

    expect(approval.status).toBe('pending');
    expect(approval.approvers).toStrictEqual([ready.chairId]);
    expect(approval.deadline?.getTime()).toBeGreaterThan(Date.now());
    await expect(getInvoice(ctx, ready.invoiceId)).resolves.toMatchObject({
      status: 'pending_approval',
      approvalId,
    });
  });

  it('approves the invoice only once the committee has said so', async () => {
    const ready = await readyForApproval(ctx, 'bare-svj');
    const approvalId = await propose(ready);

    await approvals.decide(ready.chair, approvalId, 'approved');
    await deliverDecision(approvalId, 'approved');

    await expect(getInvoice(ctx, ready.invoiceId)).resolves.toMatchObject({ status: 'approved' });
  });

  it('rejects the invoice when the committee refuses it', async () => {
    const ready = await readyForApproval(ctx, 'delivered-twice');
    const approvalId = await propose(ready);

    await approvals.decide(ready.chair, approvalId, 'rejected', 'Práce nebyla provedena');
    await deliverDecision(approvalId, 'rejected');

    await expect(getInvoice(ctx, ready.invoiceId)).resolves.toMatchObject({ status: 'rejected' });
  });
});
