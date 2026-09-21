import { z } from 'zod';
import { candidateSchema, transactionDetailSchema, transactionSchema } from '../domain/views';

/** What the browser side of this feature sees; the screens fetch nothing themselves (ADR 0017). */
export const transactionListView = z.array(transactionSchema);
export const transactionDetailView = transactionDetailSchema;

export type TransactionView = z.output<typeof transactionSchema>;
export type TransactionDetailView = z.output<typeof transactionDetailSchema>;
export type CandidateView = z.output<typeof candidateSchema>;
