import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { RequestContext } from '../../../../packages/kernel/src/context/index';
import type { Role } from '../../../../packages/kernel/src/identity/index';
import { requirePrincipal } from './require-principal';
import type { Principal } from './state';

/** Reachable without a credential. Only `/health` and `/auth/login` carry it. */
export const PUBLIC = 'domovnik:public';
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(PUBLIC, true);

export const ROLES = 'domovnik:roles';
export const Roles = (...roles: readonly Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES, roles);

export const SVJ_ACCESS = 'domovnik:svj-access';
export const RequireSvjAccess = (): MethodDecorator & ClassDecorator => SetMetadata(SVJ_ACCESS, true);

const principalOf = (context: ExecutionContext): Principal =>
  requirePrincipal(context.switchToHttp().getRequest<FastifyRequest>().raw);

export const CurrentPrincipal = createParamDecorator((_data: unknown, context: ExecutionContext): Principal =>
  principalOf(context),
);

export const Ctx = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestContext => principalOf(context).ctx,
);
