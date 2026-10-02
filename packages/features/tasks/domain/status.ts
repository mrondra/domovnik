import { DomainError } from '../../../kernel/src/errors/index';
import type { TaskStatus } from './types';

/** Every step a task takes goes through `assertTransition`; `done` and `cancelled` can only be reopened. */
export const TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  open: ['in_progress', 'waiting', 'done', 'cancelled'],
  in_progress: ['waiting', 'done', 'cancelled', 'open'],
  waiting: ['in_progress', 'done', 'cancelled'],
  done: ['open'],
  cancelled: ['open'],
};

/** Statuses of a task that still needs work; shared by the overdue rule and `closeTasksForOrigin`. */
export const OPEN_STATUSES: readonly TaskStatus[] = ['open', 'in_progress', 'waiting'];

/** Statuses that end a task and stamp `closed_at`. */
export const CLOSING_STATUSES: readonly TaskStatus[] = ['done', 'cancelled'];

export const assertTransition = (from: TaskStatus, to: TaskStatus): void => {
  if (TRANSITIONS[from].includes(to)) return;

  throw new DomainError(`Úkol nemůže přejít z „${from}“ do „${to}“`, {
    code: 'task_transition_invalid',
    details: { from, to, allowed: TRANSITIONS[from] },
  });
};
