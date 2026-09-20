'use server';

import { revalidatePath } from 'next/cache';
import type { ScenarioResultView } from '../../../../packages/features/demo/ui/index';
import { runScenario } from '../api/demo';

/**
 * Running a scenario really does deliver an invoice, so the lists that would show it are revalidated
 * — the point of the button is that the rest of the application reacts (task 019).
 */
export const run = async (code: string): Promise<ScenarioResultView | string> => {
  const result = await runScenario(code);
  if (!result.ok) return result.message;

  revalidatePath('/invoices');
  revalidatePath('/approvals');
  return result.data;
};
