import { describe, expect, it } from 'vitest';
import { createGate } from '../runtime/limiter';

interface Peak {
  readonly task: () => Promise<void>;
  readonly highest: () => number;
}

/** Counts how many tasks are inside the gate at the same moment, across an artificial delay. */
const peakCounter = (delayMs: number): Peak => {
  let running = 0;
  let highest = 0;

  return {
    task: async () => {
      running += 1;
      highest = Math.max(highest, running);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      running -= 1;
    },
    highest: () => highest,
  };
};

describe('createGate', () => {
  it('never lets more than the limit run at once', async () => {
    const gate = createGate(2);
    const counter = peakCounter(5);

    await Promise.all(Array.from({ length: 10 }, () => gate('invoice-processor', counter.task)));

    expect(counter.highest()).toBe(2);
  });

  it('counts each key separately', async () => {
    const gate = createGate(1);
    const counter = peakCounter(5);

    await Promise.all([gate('tenant-a', counter.task), gate('tenant-b', counter.task)]);

    expect(counter.highest()).toBe(2);
  });

  it('releases the slot when a task fails', async () => {
    const gate = createGate(1);
    const counter = peakCounter(1);

    await expect(gate('agent', () => Promise.reject(new TypeError('selhalo')))).rejects.toThrow('selhalo');
    await gate('agent', counter.task);

    expect(counter.highest()).toBe(1);
  });

  it('lets every waiting task through in the end', async () => {
    const gate = createGate(3);
    const done: number[] = [];

    await Promise.all(
      Array.from({ length: 12 }, (_unused, index) =>
        gate('agent', () => {
          done.push(index);
          return Promise.resolve();
        }),
      ),
    );

    expect(done).toHaveLength(12);
  });
});
