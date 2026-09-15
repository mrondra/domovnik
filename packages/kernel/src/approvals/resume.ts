import { and, eq, isNull, sql } from 'drizzle-orm';
import { audit } from '../audit/index';
import { createContext, type RequestContext } from '../context/index';
import { approval } from '../db/schema/index';
import { withTenant } from '../db/tenant';
import { subscribe, type DeliveredEvent, type Subscription } from '../events/subscribe';
import { rolesOf } from '../identity/service/users';
import { approvalIdSchema, svjIdSchema, userIdSchema, type ApprovalId } from '../ids/index';
import { logger } from '../logger/index';
import { requireTool, runToolHandler } from '../tools/registry/index';
import { approvalDecided } from './events';

interface DeferredAction {
  readonly toolName: string;
  readonly input: unknown;
  readonly decidedBy: string | null;
  readonly svjId: string | null;
  readonly status: string;
  readonly executedAt: Date | null;
}

const load = (ctx: RequestContext, id: ApprovalId): Promise<DeferredAction | undefined> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({
        toolName: approval.toolName,
        input: approval.input,
        decidedBy: approval.decidedBy,
        svjId: approval.svjId,
        status: approval.status,
        executedAt: approval.executedAt,
      })
      .from(approval)
      .where(eq(approval.id, id))
      .limit(1);
    return rows[0];
  });

/** The action belongs to whoever approved it, not to the worker that happens to carry it out. */
const executorContext = async (ctx: RequestContext, action: DeferredAction): Promise<RequestContext> => {
  const svjId = action.svjId === null ? undefined : svjIdSchema.parse(action.svjId);
  if (action.decidedBy === null) return { ...ctx, svjId };

  const userId = userIdSchema.parse(action.decidedBy);
  return createContext({
    tenantId: ctx.tenantId,
    actor: { type: 'user', id: userId, roles: await rolesOf(ctx, userId) },
    correlationId: ctx.correlationId,
    svjId,
  });
};

/**
 * Runs the handler an approved `Approval` deferred (ADR 0006), exactly where ADR 0015 says it runs.
 * Delivery is at-least-once, so `executed_at` — written with the result in one transaction — is what
 * keeps a redelivered decision from repeating a side effect that already happened.
 */
export const resumeApproval = async (ctx: RequestContext, id: ApprovalId): Promise<boolean> => {
  const action = await load(ctx, id);
  if (action?.status !== 'approved' || action.executedAt !== null) return false;

  const executor = await executorContext(ctx, action);
  const output = await runToolHandler(executor, requireTool(action.toolName), action.input);

  return withTenant(executor, async (tx) => {
    const done = await tx
      .update(approval)
      .set({ result: output ?? null, executedAt: sql`now()` })
      .where(and(eq(approval.id, id), isNull(approval.executedAt)))
      .returning({ id: approval.id });

    if (done.length === 0) return false;

    await audit.record(executor, {
      action: 'approval.executed',
      entity: 'approval',
      entityId: id,
      reason: `Tool ${action.toolName} proveden po schválení`,
      after: { toolName: action.toolName },
    });
    return true;
  });
};

const onDecision = async (ctx: RequestContext, event: DeliveredEvent): Promise<void> => {
  const payload = approvalDecided.schema.parse(event.payload);
  if (payload.decision !== 'approved') return;

  const executed = await resumeApproval(ctx, approvalIdSchema.parse(payload.approvalId));
  logger().info({ approvalId: payload.approvalId, tool: payload.toolName, executed }, 'Approval resume');
};

/** Registered by `apps/workers` at startup; nothing runs deferred handlers without it. */
export const subscribeApprovalResume = (): Subscription =>
  subscribe(approvalDecided.name, onDecision, { subscriber: 'approval-resume' });
