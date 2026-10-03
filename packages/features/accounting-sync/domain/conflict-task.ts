import type { SyncConflict } from './sync';

const show = (value: unknown): string => (typeof value === 'string' ? value : JSON.stringify(value));

export const conflictTaskTitle = (conflict: SyncConflict): string => `Rozpor s Pohodou: ${conflict.field}`;

export const conflictTaskDescription = (conflict: SyncConflict): string =>
  [
    `Pole: ${conflict.field} (${conflict.entityType} ${conflict.entityId})`,
    `Naše hodnota: ${show(conflict.ours)}`,
    `Hodnota v Pohodě: ${show(conflict.theirs)}`,
  ].join('\n');
