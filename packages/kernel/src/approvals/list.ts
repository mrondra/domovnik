import { and, desc, eq, or, sql } from 'drizzle-orm';
import type { RequestContext } from '../context/index';
import { approval } from '../db/schema/index';
import { withTenant } from '../db/tenant';
import { NotFoundError } from '../errors/index';
import { hasPermission } from '../identity/permissions';
import { approvalIdSchema, type ApprovalId } from '../ids/index';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalSummary {
  readonly id: ApprovalId;
  readonly toolName: string;
  readonly status: ApprovalStatus;
  readonly approvers: readonly string[];
  readonly deadline: Date | null;
  readonly createdAt: Date;
}

export interface ApprovalDetail extends ApprovalSummary {
  readonly input: unknown;
  readonly evidence: unknown;
  readonly comment: string | null;
  readonly result: unknown;
  /** `null` on an approved row means the deferred handler has not run yet (ADR 0015). */
  readonly executedAt: Date | null;
}

const columns = {
  id: approval.id,
  toolName: approval.toolName,
  status: approval.status,
  approvers: approval.approvers,
  deadline: approval.deadline,
  createdAt: approval.createdAt,
} as const;

/** An approval with no named approvers is open to anyone who may decide at all. */
const addressedToActor = (ctx: RequestContext) =>
  ctx.actor.id === null
    ? sql`true`
    : or(sql`jsonb_array_length(${approval.approvers}) = 0`, sql`${approval.approvers} ? ${ctx.actor.id}`);

export interface ApprovalQuery {
  readonly status?: ApprovalStatus | undefined;
}

/**
 * The inbox: what this actor is being asked to decide. An actor without `approval.decide` has an
 * empty inbox rather than an error — there is nothing wrong with asking.
 */
export const listApprovals = async (
  ctx: RequestContext,
  query: ApprovalQuery = {},
): Promise<readonly ApprovalSummary[]> => {
  if (!hasPermission(ctx.actor, 'approval.decide')) return [];

  return withTenant(ctx, async (tx) => {
    const rows = await tx
      .select(columns)
      .from(approval)
      .where(and(eq(approval.status, query.status ?? 'pending'), addressedToActor(ctx)))
      .orderBy(desc(approval.createdAt));
    return rows.map((row) => ({ ...row, id: approvalIdSchema.parse(row.id) }));
  });
};

export const getApproval = async (ctx: RequestContext, id: ApprovalId): Promise<ApprovalDetail> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({
        ...columns,
        input: approval.input,
        evidence: approval.evidence,
        comment: approval.comment,
        result: approval.result,
        executedAt: approval.executedAt,
      })
      .from(approval)
      .where(eq(approval.id, id))
      .limit(1);

    const found = rows[0];
    if (found === undefined) {
      throw new NotFoundError('Schválení nenalezeno', { code: 'approval_not_found', details: { id } });
    }
    return { ...found, id: approvalIdSchema.parse(found.id) };
  });
