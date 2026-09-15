import { z } from 'zod';

export const newTokenSchema = z.object({
  name: z.string().min(1, 'Název je povinný.').max(120),
  allowedTools: z.array(z.string()).min(1, 'Vyber aspoň jeden tool.'),
  /** Empty means no expiry; the API takes an ISO instant or `null`. */
  expiresAt: z.string(),
});

export type NewTokenInput = z.output<typeof newTokenSchema>;

export type IssueResult =
  { readonly ok: true; readonly token: string } | { readonly ok: false; readonly message: string };
