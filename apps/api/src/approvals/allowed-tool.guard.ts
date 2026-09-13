import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { approvals } from '../../../../packages/kernel/src/approvals/index';
import { ForbiddenError } from '../../../../packages/kernel/src/errors/index';
import { approvalIdSchema } from '../../../../packages/kernel/src/ids/index';
import { requirePrincipal } from '../http/require-principal';

/**
 * Deciding an approval runs the deferred tool handler (ADR 0006), so this is the one route in the
 * API that executes a tool by name. An API token is a subset of its owner's tools (zadání §9), and
 * this is where that subset is enforced — a session or a signed link carries no such narrowing.
 */
@Injectable()
export class AllowedToolGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest<{ Params: { id?: string } }>>();
    const principal = requirePrincipal(request.raw);
    if (principal.allowedTools === null) return true;

    const id = approvalIdSchema.parse(request.params.id);
    const { toolName } = await approvals.get(principal.ctx, id);

    if (!principal.allowedTools.includes(toolName)) {
      throw new ForbiddenError(`Token neumožňuje volat tool ${toolName}`, {
        code: 'tool_not_allowed_by_token',
        details: { tool: toolName },
      });
    }
    return true;
  }
}
