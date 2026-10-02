import * as composedSchema from '../../../db/src/schema';
import { startTestDb, withTestTenant } from '../../../kernel/src/testing/index';
import type { TestDatabase, TestTenant } from '../../../kernel/src/testing/index';

/** Composed, not hand-listed: tasks reads `department` and `department_member` from `svj`. */
export const startTasksDb = (): Promise<TestDatabase> => startTestDb(composedSchema);

export { withTestTenant };
export type { TestDatabase, TestTenant };
