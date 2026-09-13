import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { ForbiddenError } from '../../../../packages/kernel/src/errors/index';
import type { Role } from '../../../../packages/kernel/src/identity/index';
import { ROLES } from './decorators';
import { requirePrincipal } from './require-principal';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<readonly Role[] | undefined>(ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required === undefined || required.length === 0) return true;

    const { actor } = requirePrincipal(context.switchToHttp().getRequest<FastifyRequest>().raw).ctx;
    if (!required.some((role) => actor.roles.includes(role))) {
      throw new ForbiddenError('Aktér nemá potřebnou roli', {
        code: 'role_required',
        details: { required },
      });
    }
    return true;
  }
}
