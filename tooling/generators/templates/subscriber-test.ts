import { queueName, subscriberId, symbolOf, type SubscriberInput } from './subscriber-names';

export const subscriberIntTest = (
  input: SubscriberInput,
): string => `import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { deliveryContext, type DeliveredEvent } from '../../../kernel/src/events/index';
import { eventIdSchema, newId } from '../../../kernel/src/ids/index';
import {
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../kernel/src/testing/index';
import { ${symbolOf(input)} } from '../subscribers/${input.subscriber.kebab}';

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

/** Doplň payload podle schématu eventu. */
const delivered = (): DeliveredEvent => ({
  eventId: newId(eventIdSchema),
  name: ${symbolOf(input)}.event,
  version: 1,
  payload: {},
  tenantId: tenant.ctx.tenantId,
  correlationId: tenant.ctx.correlationId,
});

describe('subscriber ${subscriberId(input)}', () => {
  it('drains the queue named after its event and itself', () => {
    expect(${symbolOf(input)}.queue).toBe('${queueName(input)}');
  });

  it('does the work once, whatever the delivery does', async () => {
    const event = delivered();

    await ${symbolOf(input)}.handler(deliveryContext(event), event);
    await ${symbolOf(input)}.handler(deliveryContext(event), event);

    // Doplň: ověř, že se efekt v databázi stal právě jednou.
    expect(${symbolOf(input)}.idempotencyKey(event)).toBe(event.eventId);
  }, 120_000);
});
`;
