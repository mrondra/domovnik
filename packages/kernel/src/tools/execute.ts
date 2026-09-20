import { createApproval } from '../approvals/create';
import type { RequestContext } from '../context/index';
import { ForbiddenError } from '../errors/index';
import { hasPermission } from '../identity/permissions';
import type { ApprovalId } from '../ids/index';
import { logger } from '../logger/index';
import { requireTool, runToolHandler } from './registry/index';

export type ToolExecution =
  | { readonly status: 'ok'; readonly output: unknown }
  | { readonly status: 'pending_approval'; readonly approvalId: ApprovalId };

/**
 * The single entry point for every caller — REST controller, MCP server and agent alike (zadání
 * §2.4). A tool whose policy returns `required` never reaches its handler here (ADR 0006).
 */
export const executeTool = async (
  ctx: RequestContext,
  name: string,
  input: unknown,
): Promise<ToolExecution> => {
  const tool = requireTool(name);

  if (!hasPermission(ctx.actor, tool.permission)) {
    throw new ForbiddenError(`Aktér nemá oprávnění ${tool.permission}`, {
      code: 'tool_forbidden',
      details: { tool: name, permission: tool.permission },
    });
  }

  const policy = await tool.approval(ctx, input);

  if (policy.required) {
    const approvalId = await createApproval(ctx, {
      toolName: name,
      input,
      evidence: { requestedBy: ctx.actor.type, correlationId: ctx.correlationId },
      approvers: policy.approvers,
      deadline: policy.deadline,
    });
    await tool.onApprovalRequested?.(ctx, input, approvalId);
    logger().info({ tool: name, approvalId }, 'Tool čeká na schválení');
    return { status: 'pending_approval', approvalId };
  }

  return { status: 'ok', output: await runToolHandler(ctx, tool, input) };
};
