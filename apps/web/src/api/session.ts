import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ROLES, type Role } from '../../../../packages/kernel/src/identity/roles';
import { SESSION_COOKIE } from '../../../../packages/kernel/src/identity/session-cookie';
import { callApi } from './client';

export const sessionSchema = z.object({
  tenantId: z.uuid(),
  userId: z.uuid().nullable(),
  roles: z.array(z.enum(ROLES)),
  svjId: z.uuid().nullable(),
  credential: z.enum(['session', 'api-token', 'signed-link']),
});

export type Session = z.output<typeof sessionSchema>;

/** Roles allowed to look across every SVJ of the tenant at once (task 006 §3). */
const CROSS_SVJ_ROLES: readonly Role[] = ['tenant_admin', 'manager'];

export const canViewAcrossSvj = (session: Session): boolean =>
  session.roles.some((role) => CROSS_SVJ_ROLES.includes(role));

/**
 * The cookie is checked first so an anonymous visitor costs no round trip; the API is what actually
 * decides whether the session is still valid.
 */
export const getSession = async (): Promise<Session | null> => {
  const jar = await cookies();
  if (jar.get(SESSION_COOKIE) === undefined) return null;

  const result = await callApi('/auth/me', sessionSchema);
  return result.ok ? result.data : null;
};

export const requireSession = async (): Promise<Session> => {
  const session = await getSession();
  if (session === null) redirect('/login');
  return session;
};
