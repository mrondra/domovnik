import { subscribe } from '../../../kernel/src/events/index';
import { closeTasksForOrigin } from '../../tasks/index';
import { syncConflictResolved } from '../domain/events';

/** A decided conflict is no longer anybody's work. Closing finds nothing the second time. */
export const closeConflictTask = subscribe(
  syncConflictResolved.name,
  async (ctx, event) => {
    const payload = syncConflictResolved.schema.parse(event.payload);

    await closeTasksForOrigin(
      ctx,
      { type: 'sync_conflict', id: payload.conflictId },
      { status: 'done', note: 'Konflikt byl vyřešen' },
    );
  },
  { subscriber: 'accounting-sync.close-conflict-task' },
);
