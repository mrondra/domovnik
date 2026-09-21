import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { accountingStatusSchema, conflictSchema } from '../domain/views';
import type { AccountingLink } from '../domain/types';
import { resolveConflict, type ResolveConflictInput } from './conflict-decisions';
import { linkOf, linkSvj, type LinkSvjInput } from './links';
import { syncStatements, type StatementRange } from './statements';
import { accountingStatusView, conflictView } from './views';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method
 * is the function next to it, so a subscriber or a seed can do the same thing without going
 * through Nest.
 */
@Injectable()
export class AccountingSyncService {
  linkSvj(ctx: RequestContext, input: LinkSvjInput): Promise<void> {
    return linkSvj(ctx, input);
  }

  linkOf(ctx: RequestContext, svjId: SvjId): Promise<AccountingLink | null> {
    return linkOf(ctx, svjId);
  }

  status(ctx: RequestContext, svjId: SvjId): Promise<z.output<typeof accountingStatusSchema>> {
    return accountingStatusView(ctx, svjId);
  }

  syncStatements(ctx: RequestContext, range: StatementRange): Promise<{ readonly count: number }> {
    return syncStatements(ctx, range);
  }

  async resolveConflict(
    ctx: RequestContext,
    input: ResolveConflictInput,
  ): Promise<z.output<typeof conflictSchema>> {
    return conflictView(await resolveConflict(ctx, input));
  }
}
