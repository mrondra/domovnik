import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { recordActivity } from './activity';
import { loadReachable } from './reach';

export const commentTask = (ctx: RequestContext, taskId: string, body: string): Promise<void> =>
  withTenant(ctx, async (tx) => {
    await loadReachable(ctx, tx, taskId);

    await audit.record(ctx, {
      action: 'ops.task.commented',
      entity: 'task',
      entityId: taskId,
      reason: 'Komentář k úkolu',
      after: { body },
    });
    await recordActivity(ctx, tx, { taskId, kind: 'comment', body });
  });
