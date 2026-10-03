import { withTenant } from '../../../kernel/src/db/index';
import { subscribe } from '../../../kernel/src/events/index';
import { createTask } from '../../tasks/index';
import { conflictTaskDescription, conflictTaskTitle } from '../domain/conflict-task';
import { syncConflictDetected } from '../domain/events';
import { syncConflictIdSchema } from '../domain/ids';
import { getConflict } from '../service/index';

/**
 * The guard agent proposes, but finance needs a place to see that something is open: one task per
 * conflict. `dedupeKey` makes a second delivery of the same batch answer the tasks it already made.
 */
export const raiseConflictTasks = subscribe(
  syncConflictDetected.name,
  (ctx, event) => {
    const payload = syncConflictDetected.schema.parse(event.payload);

    return withTenant(ctx, async () => {
      for (const id of payload.conflictIds) {
        const conflictId = syncConflictIdSchema.parse(id);
        const conflict = await getConflict(ctx, conflictId);

        await createTask(ctx, {
          svjId: conflict.svjId,
          title: conflictTaskTitle(conflict),
          description: conflictTaskDescription(conflict),
          priority: 'high',
          departmentCode: 'finance',
          origin: { type: 'sync_conflict', id: conflictId },
          dedupeKey: `sync_conflict:${conflictId}`,
        });
      }
    });
  },
  { subscriber: 'accounting-sync.conflict-tasks' },
);
