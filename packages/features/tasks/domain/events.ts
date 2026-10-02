import { z } from 'zod';
import { defineEvent } from '../../../kernel/src/events/index';

const priority = z.enum(['low', 'normal', 'high', 'urgent']);
const status = z.enum(['open', 'in_progress', 'waiting', 'done', 'cancelled']);

/** Domain events are past tense and named `domena.entita.akce` (docs/engineering.md §3). */
export const taskCreated = defineEvent(
  'ops.task.created',
  z.object({
    taskId: z.uuid(),
    svjId: z.uuid().nullable(),
    departmentId: z.uuid(),
    priority,
    originType: z.string().nullable(),
    originId: z.uuid().nullable(),
  }),
);

export const taskAssigned = defineEvent(
  'ops.task.assigned',
  z.object({ taskId: z.uuid(), assigneeId: z.uuid().nullable() }),
);

export const taskStatusChanged = defineEvent(
  'ops.task.status_changed',
  z.object({ taskId: z.uuid(), from: status, to: status }),
);
