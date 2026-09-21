import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { BankTransaction, IsoDay, MatchStatus } from '../domain/types';
import { bankTransaction } from '../schema';
import { assertReachable } from './reach';
import { toTransaction } from './rows';

export interface BrowseTransactionsInput {
  readonly svjId: SvjId;
  readonly status?: MatchStatus | undefined;
  readonly from?: IsoDay | undefined;
  readonly to?: IsoDay | undefined;
}

/** The statement as a person reads it: newest first, narrowed by what they came to look for. */
export const browseTransactions = (
  ctx: RequestContext,
  input: BrowseTransactionsInput,
): Promise<readonly BankTransaction[]> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, input.svjId);

    const rows = await tx
      .select()
      .from(bankTransaction)
      .where(
        and(
          eq(bankTransaction.svjId, input.svjId),
          input.status === undefined ? undefined : eq(bankTransaction.matchStatus, input.status),
          input.from === undefined ? undefined : gte(bankTransaction.bookedOn, input.from),
          input.to === undefined ? undefined : lte(bankTransaction.bookedOn, input.to),
        ),
      )
      .orderBy(desc(bankTransaction.bookedOn), desc(bankTransaction.createdAt));

    return rows.map(toTransaction);
  });
