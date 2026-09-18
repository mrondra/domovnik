import { z } from 'zod';

/** One zod definition per domain shape, reused by the events, the tools and the HTTP contract. */
export const budgetCategorySchema = z.enum([
  'uklid',
  'vytah',
  'energie',
  'opravy',
  'revize',
  'sprava',
  'pojisteni',
  'ostatni',
]);

export const invoiceStatusSchema = z.enum([
  'received',
  'extracted',
  'needs_review',
  'pending_approval',
  'approved',
  'rejected',
  'posted',
  'paid',
]);
