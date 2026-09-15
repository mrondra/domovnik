import { z } from 'zod';
import { callApi, readApi, type ApiResult } from './client';

/** Mirrors `apps/api/src/api-tokens/api-tokens.schema.ts`; see the note in `approvals.ts`. */
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

export const availableToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  readOnly: z.boolean(),
  userComposable: z.boolean(),
});

const issuedTokenSchema = z.object({ id: z.uuid(), token: z.string() });
const acknowledgedSchema = z.object({ ok: z.literal(true) });

export type TokenSummary = z.output<typeof tokenSummarySchema>;
export type AvailableTool = z.output<typeof availableToolSchema>;
export type IssuedToken = z.output<typeof issuedTokenSchema>;

export const listApiTokens = (): Promise<readonly TokenSummary[]> =>
  readApi('/api-tokens', z.array(tokenSummarySchema));

export const listAvailableTools = (): Promise<readonly AvailableTool[]> =>
  readApi('/api-tokens/tools', z.array(availableToolSchema));

export interface NewToken {
  readonly name: string;
  readonly allowedTools: readonly string[];
  readonly expiresAt: string | null;
}

export const createApiToken = (body: NewToken): Promise<ApiResult<IssuedToken>> =>
  callApi('/api-tokens', issuedTokenSchema, { method: 'POST', body });

export const revokeApiToken = (id: string): Promise<ApiResult<z.output<typeof acknowledgedSchema>>> =>
  callApi(`/api-tokens/${id}`, acknowledgedSchema, { method: 'DELETE' });
