'use server';

import { revalidatePath } from 'next/cache';
import type { ResetResultView, ScenarioResultView } from '../../../../packages/features/demo/ui/index';
import { resetDemo, runScenario } from '../api/demo';

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

/**
 * A reset takes away what every other screen is showing, so they are all revalidated — somebody
 * who resets and then clicks straight to the invoices must not be shown a cached list of rows
 * that no longer exist (task 026).
 */
export const reset = async (): Promise<ResetResultView | string> => {
  const result = await resetDemo();
  if (!result.ok) return result.message;

  revalidatePath('/', 'layout');
  return result.data;
};
