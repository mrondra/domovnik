import { eq } from 'drizzle-orm';
import { eventOutbox } from '../../../../packages/kernel/src/db/schema/index';
import { withTenant } from '../../../../packages/kernel/src/db/index';
import type { RequestContext } from '../../../../packages/kernel/src/context/index';
import type { EventId } from '../../../../packages/kernel/src/ids/index';

const STEP_MS = 100;
const TIMEOUT_MS = 20_000;

/** The queue polls, so an assertion about it is only meaningful once it has had a chance to run. */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeoutMs = TIMEOUT_MS,
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (!(await condition()) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, STEP_MS));
  }
};

/** Waits out the poll interval to show that nothing further arrives, rather than that it is late. */
export const settle = (ms = 3000): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A relay that sent its jobs and then died before marking the outbox published — the exact crash the
 * deterministic job id is there to survive.
 */
export const rewindOutbox = async (ctx: RequestContext, eventId: EventId): Promise<void> => {
  await withTenant(ctx, async (tx) => {
    await tx.update(eventOutbox).set({ status: 'pending' }).where(eq(eventOutbox.eventId, eventId));
  });
};
