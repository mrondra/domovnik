import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../kernel/src/errors/index';
import { CLOSING_STATUSES, OPEN_STATUSES, assertTransition } from '../domain/status';
import type { TaskStatus } from '../domain/types';

const ALL: readonly TaskStatus[] = ['open', 'in_progress', 'waiting', 'done', 'cancelled'];

const ALLOWED: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  open: ['in_progress', 'waiting', 'done', 'cancelled'],
  in_progress: ['open', 'waiting', 'done', 'cancelled'],
  waiting: ['in_progress', 'done', 'cancelled'],
  done: ['open'],
  cancelled: ['open'],
};

const pairs = ALL.flatMap((from) =>
  ALL.map((to) => [from, to, ALLOWED[from].includes(to)] as const),
);

describe('the task state machine', () => {
  it('covers all 25 pairs', () => {
    expect(pairs).toHaveLength(25);
  });

  it.each(pairs)('%s → %s allowed=%s', (from, to, allowed) => {
    const attempt = (): void => {
      assertTransition(from, to);
    };

    if (allowed) expect(attempt).not.toThrow();
    else expect(attempt).toThrow(DomainError);
  });

  it('names the rule it broke', () => {
    expect(() => {
      assertTransition('done', 'waiting');
    }).toThrow(expect.objectContaining({ code: 'task_transition_invalid' }));
  });

  it('splits statuses into open and closing without overlap', () => {
    expect([...OPEN_STATUSES].sort()).toStrictEqual(['in_progress', 'open', 'waiting']);
    expect([...CLOSING_STATUSES].sort()).toStrictEqual(['cancelled', 'done']);
  });
});
