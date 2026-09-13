import { z } from 'zod';
import { ROLES } from '../../../../packages/kernel/src/identity/index';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const meSchema = z.object({
  tenantId: z.uuid(),
  userId: z.uuid().nullable(),
  roles: z.array(z.enum(ROLES)),
  svjId: z.uuid().nullable(),
  credential: z.enum(['session', 'api-token', 'signed-link']),
});

export const loggedInSchema = z.object({ userId: z.uuid(), expiresAt: z.iso.datetime() });

export const acknowledgedSchema = z.object({ ok: z.literal(true) });
