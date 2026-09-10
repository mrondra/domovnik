import type { RequestContext } from '../context/index';
import { audit } from '../audit/index';
import { approval } from '../db/schema/index';
import { withTenant } from '../db/tenant';
import { approvalIdSchema, newId, type ApprovalId } from '../ids/index';

export interface CreateApprovalInput {
  readonly toolName: string;
  readonly input: unknown;
  readonly evidence: unknown;
  readonly approvers: readonly string[];
  readonly deadline?: Date | undefined;
}

export const createApproval = async (
  ctx: RequestContext,
  input: CreateApprovalInput,
): Promise<ApprovalId> => {
  const id = newId(approvalIdSchema);

  await withTenant(ctx, async (tx) => {
    await tx.insert(approval).values({
      id,
      tenantId: ctx.tenantId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      toolName: input.toolName,
      input: input.input,
      evidence: input.evidence,
      approvers: input.approvers,
      deadline: input.deadline ?? null,
      svjId: ctx.svjId ?? null,
      agentRunId: ctx.agentRunId ?? null,
    });

    await audit.record(ctx, {
      action: 'approval.created',
      entity: 'approval',
      entityId: id,
      reason: `Tool ${input.toolName} vyžaduje schválení`,
      after: { toolName: input.toolName, approvers: input.approvers },
    });
  });

  return id;
};
