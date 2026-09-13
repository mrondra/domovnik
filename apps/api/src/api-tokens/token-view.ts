import type { z } from 'zod';
import type { ApiTokenSummary } from '../../../../packages/kernel/src/identity/index';
import type { tokenSummarySchema } from './api-tokens.schema';

export const toTokenSummary = (row: ApiTokenSummary): z.output<typeof tokenSummarySchema> => ({
  id: row.id,
  name: row.name,
  ownerUserId: row.ownerUserId,
  allowedTools: [...row.allowedTools],
  svjScope: row.svjScope === null ? null : [...row.svjScope],
  expiresAt: row.expiresAt?.toISOString() ?? null,
  lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  revokedAt: row.revokedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});
