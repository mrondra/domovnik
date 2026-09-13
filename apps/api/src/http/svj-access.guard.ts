import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { ForbiddenError } from '../../../../packages/kernel/src/errors/index';
import { accessibleSvj } from '../../../../packages/kernel/src/identity/index';
import type { SvjId } from '../../../../packages/kernel/src/ids/index';
import { SVJ_ACCESS } from './decorators';
import { requirePrincipal } from './require-principal';
import type { Principal } from './state';

const refuse = (code: string, details: Readonly<Record<string, unknown>>): never => {
  throw new ForbiddenError('K tomuto SVJ nemáš přístup', { code, details });
};

/**
 * Two narrowings, both of which have to hold: what the person may reach, and what the credential
 * they used may reach. An API token can only ever be a subset of its owner (zadání §9).
 */
const assertReachable = async (principal: Principal, svjId: SvjId): Promise<void> => {
  if (principal.svjScope !== null && !principal.svjScope.includes(svjId)) {
    refuse('svj_outside_token_scope', { svjId });
  }

  const actor = principal.ctx.actor;
  if (actor.type !== 'user') return;

  const allowed = await accessibleSvj(principal.ctx, actor.id);
  if (allowed !== null && !allowed.includes(svjId)) refuse('svj_forbidden', { svjId });
};

@Injectable()
export class SvjAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean | undefined>(SVJ_ACCESS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required !== true) return true;

    const principal = requirePrincipal(context.switchToHttp().getRequest<FastifyRequest>().raw);
    const svjId = principal.ctx.svjId;
    if (svjId === undefined) {
      throw new ForbiddenError('Požadavek neurčuje SVJ', { code: 'svj_missing' });
    }

    await assertReachable(principal, svjId);
    return true;
  }
}
