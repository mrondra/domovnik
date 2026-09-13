import { eq } from 'drizzle-orm';
import { user } from '../../db/schema/index';
import { withSystem } from '../../db/tenant';
import { UnauthenticatedError } from '../../errors/index';
import { tenantIdSchema, userIdSchema, type TenantId, type UserId } from '../../ids/index';
import type { Role } from '../roles';
import { verifyPassword } from '../secrets';
import { systemContext } from './system-context';
import { rolesOf } from './users';

export interface AuthenticatedUser {
  readonly tenantId: TenantId;
  readonly userId: UserId;
  readonly roles: readonly Role[];
}

const INVALID = 'Neplatné přihlašovací údaje';

export const authenticate = async (email: string, password: string): Promise<AuthenticatedUser> => {
  const candidate = await withSystem({ reason: 'sign-in lookup' }, async (tx) => {
    const rows = await tx
      .select({
        id: user.id,
        tenantId: user.tenantId,
        passwordHash: user.passwordHash,
        isActive: user.isActive,
      })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    return rows[0];
  });

  if (!candidate?.isActive) {
    throw new UnauthenticatedError(INVALID, { code: 'invalid_credentials' });
  }
  if (!(await verifyPassword(candidate.passwordHash, password))) {
    throw new UnauthenticatedError(INVALID, { code: 'invalid_credentials' });
  }

  const tenantId = tenantIdSchema.parse(candidate.tenantId);
  const userId = userIdSchema.parse(candidate.id);
  return { tenantId, userId, roles: await rolesOf(systemContext(tenantId), userId) };
};
