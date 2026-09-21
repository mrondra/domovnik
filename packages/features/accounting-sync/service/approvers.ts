import type { RequestContext } from '../../../kernel/src/context/index';
import { usersWithRole } from '../../../kernel/src/identity/index';

const DAYS_TO_DECIDE = 5;
const DAY = 24 * 60 * 60 * 1000;

/** A disagreement with the accounting is the accountants' to settle, whoever holds that job today. */
export const financeApprovers = (ctx: RequestContext): Promise<readonly string[]> =>
  usersWithRole(ctx, 'finance');

export const decideBy = (now: Date = new Date()): Date => new Date(now.getTime() + DAYS_TO_DECIDE * DAY);
