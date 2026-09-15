/** Runs `task` only once the key is below its limit, and hands the slot on when it finishes. */
export type Gate = <T>(key: string, task: () => Promise<T>) => Promise<T>;

interface Slot {
  active: number;
  readonly waiting: (() => void)[];
}

/**
 * The runtime limits from zadání §6.1 are per agent and per tenant, which pg-boss cannot express:
 * its concurrency is per queue, and a tenant's runs are spread across every agent's queue. So the
 * queue controls how many jobs this node pulls, and the gate controls how many of them proceed.
 *
 * In-process, therefore per node. A second workers instance doubles the effective limit — fine while
 * there is one, and a reason to move this to the database before there are two.
 */
export const createGate = (limit: number): Gate => {
  const slots = new Map<string, Slot>();

  const slotFor = (key: string): Slot => {
    const existing = slots.get(key);
    if (existing !== undefined) return existing;

    const fresh: Slot = { active: 0, waiting: [] };
    slots.set(key, fresh);
    return fresh;
  };

  const acquire = async (key: string): Promise<void> => {
    const slot = slotFor(key);
    if (slot.active < limit) {
      slot.active += 1;
      return;
    }
    await new Promise<void>((resolve) => slot.waiting.push(resolve));
  };

  /** The slot is handed straight to the next waiter, so `active` never dips and then spikes. */
  const release = (key: string): void => {
    const slot = slotFor(key);
    const next = slot.waiting.shift();
    if (next !== undefined) {
      next();
      return;
    }

    slot.active -= 1;
    if (slot.active === 0) slots.delete(key);
  };

  return async (key, task) => {
    await acquire(key);
    try {
      return await task();
    } finally {
      release(key);
    }
  };
};
