import { asc } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { svj } from '../schema';

/**
 * The position of an SVJ among the ones this management company keeps, in the order they were taken
 * on. `receivables` builds variable symbols from it (task 012), so it is bound by RLS only and by
 * nothing else: two people looking at the same SVJ must read the same number, whatever either of
 * them may reach. A symbol once issued is stored on the prescription and no longer depends on this.
 */
export const svjSequence = (ctx: RequestContext, svjId: SvjId): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select({ id: svj.id }).from(svj).orderBy(asc(svj.createdAt), asc(svj.id));

    const position = rows.findIndex((row) => row.id === svjId);
    if (position < 0) {
      throw new NotFoundError('SVJ nenalezeno', { code: 'svj_not_found', details: { svjId } });
    }
    return position + 1;
  });
