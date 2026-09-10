import { and, eq, sql } from 'drizzle-orm';
import { audit } from '../audit/index';
import type { RequestContext } from '../context/index';
import { approval } from '../db/schema/index';
import { withTenant } from '../db/tenant';
import { ConflictError, ForbiddenError } from '../errors/index';
import { hasPermission } from '../identity/permissions';
import type { ApprovalId } from '../ids/index';
import { requireTool, runToolHandler } from '../tools/registry/index';

export type ApprovalDecision = 'approved' | 'rejected';

export interface DecisionResult {
  readonly status: ApprovalDecision;
  readonly output?: unknown;
}

const assertMayDecide = (ctx: RequestContext, approvers: readonly string[]): void => {
  if (!hasPermission(ctx.actor, 'approval.decide')) {
    throw new ForbiddenError('Aktér nesmí schvalovat', { code: 'approval_forbidden' });
  }
  const actorId = ctx.actor.id;
  if (approvers.length > 0 && (actorId === null || !approvers.includes(actorId))) {
    throw new ForbiddenError('Aktér není mezi schvalovateli', { code: 'approval_not_approver' });
  }
};

/**
 * The conditional update is what makes a decision single-shot: a second call finds no `pending` row,
 * so the deferred handler can never run twice.
 */
export const decideApproval = async (
  ctx: RequestContext,
  id: ApprovalId,
  decision: ApprovalDecision,
  comment?: string,
): Promise<DecisionResult> => {
  const decided = await withTenant(ctx, async (tx) => {
    const current = await tx
      .select({ approvers: approval.approvers })
      .from(approval)
      .where(eq(approval.id, id))
      .limit(1);
    const found = current[0];
    if (found === undefined) {
      throw new ConflictError('Schválení neexistuje', { code: 'approval_missing', details: { id } });
    }
    assertMayDecide(ctx, found.approvers);

    const updated = await tx
      .update(approval)
      .set({
        status: decision,
        decidedBy: ctx.actor.id,
        decidedAt: sql`now()`,
        comment: comment ?? null,
      })
      .where(and(eq(approval.id, id), eq(approval.status, 'pending')))
      .returning({ toolName: approval.toolName, input: approval.input });

    const row = updated[0];
    if (row === undefined) {
      throw new ConflictError('Schválení už bylo rozhodnuto', {
        code: 'approval_already_decided',
        details: { id },
      });
    }

    await audit.record(ctx, {
      action: `approval.${decision}`,
      entity: 'approval',
      entityId: id,
      reason: comment ?? `Rozhodnutí ${decision}`,
      after: { status: decision },
    });

    return row;
  });

  if (decision === 'rejected') return { status: decision };

  const output = await runToolHandler(ctx, requireTool(decided.toolName), decided.input);
  await withTenant(ctx, async (tx) => {
    await tx.update(approval).set({ result: output }).where(eq(approval.id, id));
  });

  return { status: decision, output };
};

/** Marks approvals whose deadline has passed; scheduled by the workers, not by a request. */
export const expireApprovals = async (ctx: RequestContext): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const expired = await tx
      .update(approval)
      .set({ status: 'expired' })
      .where(and(eq(approval.status, 'pending'), sql`${approval.deadline} < now()`))
      .returning({ id: approval.id });
    return expired.length;
  });
