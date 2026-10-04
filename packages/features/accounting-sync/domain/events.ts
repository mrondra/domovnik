import { z } from 'zod';
import { defineEvent } from '../../../kernel/src/events/index';

/**
 * Where our copy and Pohoda disagree, in one event for the whole sweep rather than one per
 * invoice: an agent is woken once and given the batch (ADR 0004). Domain events are past tense and
 * named `domena.entita.akce` (docs/engineering.md §3).
 */
export const syncConflictDetected = defineEvent(
  'finance.sync.conflict',
  z.object({ svjId: z.uuid(), conflictIds: z.array(z.uuid()).min(1).readonly() }),
);

/** A person decided a disagreement; whatever was waiting for that decision can stand down. */
export const syncConflictResolved = defineEvent(
  'finance.sync.conflict_resolved',
  z.object({
    svjId: z.uuid(),
    conflictId: z.uuid(),
    resolution: z.enum(['keep_ours', 'take_theirs']),
  }),
);
