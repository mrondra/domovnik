import { z } from 'zod';
import { defineEvent } from '../../../kernel/src/events/index';
import { shareSchema, unitKindSchema } from './schemas';

/** Domain events are past tense and named `domena.entita.akce` (docs/engineering.md §3). */
export const svjCreated = defineEvent(
  'svj.svj.created',
  z.object({ svjId: z.uuid(), name: z.string().min(1), ico: z.string().min(1) }),
);

/**
 * Carries the whole unit after the change rather than a diff: the consumers of this event (owners,
 * receivables) recompute from the current share, and a diff would make each of them read it back.
 */
export const unitUpdated = defineEvent(
  'svj.unit.updated',
  z.object({
    svjId: z.uuid(),
    unitId: z.uuid(),
    number: z.string().min(1),
    kind: unitKindSchema,
    share: shareSchema,
    floorArea: z.number().positive(),
  }),
);
