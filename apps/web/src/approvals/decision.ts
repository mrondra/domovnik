import { z } from 'zod';

export const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(2000),
});

export type DecisionInput = z.output<typeof decisionSchema>;

const LABELS: Readonly<Record<string, string>> = {
  pending: 'Čeká na rozhodnutí',
  approved: 'Schváleno',
  rejected: 'Zamítnuto',
  expired: 'Propadlo',
};

export const statusLabel = (status: string): string => LABELS[status] ?? status;
