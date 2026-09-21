import { and, eq, inArray } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { BankTransaction } from '../domain/types';
import { bankTransaction } from '../schema';
import { assertReachable } from './reach';
import { toTransaction } from './rows';

/** The movements the agent was handed, read back by id; the screens start here too (task 023). */
export const listTransactions = (
  ctx: RequestContext,
  svjId: SvjId,
  ids: readonly string[],
): Promise<readonly BankTransaction[]> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, svjId);
    if (ids.length === 0) return [];

    const rows = await tx
      .select()
      .from(bankTransaction)
      .where(and(eq(bankTransaction.svjId, svjId), inArray(bankTransaction.id, [...ids])));

    return rows.map(toTransaction);
  });
