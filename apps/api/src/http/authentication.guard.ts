import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { PUBLIC } from './decorators';
import { requirePrincipal } from './require-principal';

/**
 * Global: every route needs an identity unless it is explicitly `@Public()`. The default is the
 * strict one, so forgetting a decorator closes a route rather than opening it.
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic === true) return true;

    requirePrincipal(context.switchToHttp().getRequest<FastifyRequest>().raw);
    return true;
  }
}
