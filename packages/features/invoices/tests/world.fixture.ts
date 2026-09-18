import * as composedSchema from '../../../db/src/schema';
import {
  startTestDb,
  startTestStorage,
  withTestTenant,
  type TestDatabase,
  type TestStorage,
} from '../../../kernel/src/testing/index';

/**
 * Receiving a message writes the file through `documents`, which is not this feature's table to
 * import — so the test database gets the composed schema `pnpm db:generate` writes, the one place
 * that legitimately names every table there is. Storage is real for the same reason: a stubbed one
 * would prove nothing about the pair (task 015).
 */
export const TEST_SCHEMA: Record<string, unknown> = { ...composedSchema };

export interface InvoicesWorld {
  readonly database: TestDatabase;
  readonly storage: TestStorage;
  stop(): Promise<void>;
}

export const startInvoicesWorld = async (): Promise<InvoicesWorld> => {
  const database = await startTestDb(TEST_SCHEMA);
  const storage = await startTestStorage();

  return {
    database,
    storage,
    stop: async () => {
      await storage.stop();
      await database.stop();
    },
  };
};

export { someSvj } from './invoices.fixture';
export { withTestTenant };
