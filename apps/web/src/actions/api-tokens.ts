'use server';

import { revalidatePath } from 'next/cache';
import { createApiToken, revokeApiToken } from '../api/api-tokens';
import { newTokenSchema, type IssueResult, type NewTokenInput } from '../api-tokens/form-schema';

const SETTINGS_PATH = '/settings/api-tokens';

/** The plaintext travels back to the browser once and is stored nowhere (zadání kap. 9). */
export const issueToken = async (input: NewTokenInput): Promise<IssueResult> => {
  const { name, allowedTools, expiresAt } = newTokenSchema.parse(input);
  const result = await createApiToken({
    name,
    allowedTools,
    expiresAt: expiresAt === '' ? null : new Date(expiresAt).toISOString(),
  });

  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath(SETTINGS_PATH);
  return { ok: true, token: result.data.token };
};

export const revokeToken = async (id: string): Promise<string | null> => {
  const result = await revokeApiToken(id);
  if (!result.ok) return result.message;

  revalidatePath(SETTINGS_PATH);
  return null;
};
