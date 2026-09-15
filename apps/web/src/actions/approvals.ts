'use server';

import { revalidatePath } from 'next/cache';
import { decideApproval, decideBySignedLink } from '../api/approvals';
import { decisionSchema, type DecisionInput } from '../approvals/decision';

const commented = (input: DecisionInput): { decision: DecisionInput['decision']; comment?: string } =>
  input.comment === '' ? { decision: input.decision } : input;

/** Returns what to show the person; `null` means the decision went through. */
export const decide = async (id: string, input: DecisionInput): Promise<string | null> => {
  const result = await decideApproval(id, commented(decisionSchema.parse(input)));
  if (!result.ok) return result.message;

  revalidatePath('/', 'layout');
  return null;
};

/** The e-mail route: the approval comes from the signature, never from the page (zadání kap. 2). */
export const decideFromLink = async (token: string, input: DecisionInput): Promise<string | null> => {
  const result = await decideBySignedLink(token, commented(decisionSchema.parse(input)));
  return result.ok ? null : result.message;
};
