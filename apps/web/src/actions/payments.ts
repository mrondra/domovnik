'use server';

import { revalidatePath } from 'next/cache';
import { matchTransaction, type ManualMatchBody } from '../api/payments';

/**
 * Pairing a movement changes a unit's balance, so the screens that show one are revalidated. It
 * answers a message on failure rather than throwing: the person is standing in front of the list
 * and a thrown error would replace it with an error page (task 023).
 */
export const match = async (
  svjId: string,
  transactionId: string,
  body: ManualMatchBody,
): Promise<string | null> => {
  const result = await matchTransaction(transactionId, svjId, body);
  if (!result.ok) return result.message;

  revalidatePath(`/s/${svjId}/payments`);
  revalidatePath(`/s/${svjId}/receivables`);
  return null;
};
