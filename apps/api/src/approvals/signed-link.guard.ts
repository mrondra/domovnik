import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ForbiddenError } from '../../../../packages/kernel/src/errors/index';
import { requirePrincipal } from '../http/require-principal';

/** A session cookie must not reach `/a/…`: that route answers for the link's addressee, not the caller. */
@Injectable()
export class SignedLinkGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const principal = requirePrincipal(context.switchToHttp().getRequest<FastifyRequest>().raw);
    if (principal.credential !== 'signed-link' || principal.subjectId === null) {
      throw new ForbiddenError('Tahle cesta patří podepsanému odkazu', { code: 'signed_link_required' });
    }
    return true;
  }
}
