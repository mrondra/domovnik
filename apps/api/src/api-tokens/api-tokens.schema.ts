import { z } from 'zod';

export const createTokenSchema = z.object({
  name: z.string().min(1).max(120),
  allowedTools: z.array(z.string().min(1)),
  svjScope: z.array(z.uuid()).nullable().default(null),
  expiresAt: z.iso.datetime().nullable().default(null),
});

/** The plaintext appears here and nowhere else, ever again (zadání kap. 9). */
export const issuedTokenSchema = z.object({ id: z.uuid(), token: z.string() });

export const tokenSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  ownerUserId: z.uuid(),
  allowedTools: z.array(z.string()),
  svjScope: z.array(z.uuid()).nullable(),
  expiresAt: z.iso.datetime().nullable(),
  lastUsedAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

/** The checklist the token form is built from (zadání kap. 9), already filtered by permission. */
export const availableToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  readOnly: z.boolean(),
  userComposable: z.boolean(),
});
