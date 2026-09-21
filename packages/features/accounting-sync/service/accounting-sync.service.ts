import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { AccountingLink } from '../domain/types';
import { linkOf, linkSvj, type LinkSvjInput } from './links';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a seed can call the same function without going through Nest.
 */
@Injectable()
export class AccountingSyncService {
  linkSvj(ctx: RequestContext, input: LinkSvjInput): Promise<void> {
    return linkSvj(ctx, input);
  }

  linkOf(ctx: RequestContext, svjId: SvjId): Promise<AccountingLink | null> {
    return linkOf(ctx, svjId);
  }
}
