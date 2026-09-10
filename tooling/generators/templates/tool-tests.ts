import { symbolOf, toolName, type ToolInput } from './tool-names';

export const toolTest = (input: ToolInput): string => {
  const expectation = input.requiresApproval
    ? `  it('requires an approval before anything happens', async () => {
    const policy = await requireTool(${symbolOf(input)}.name).approval(ctx, { recordId: RECORD_ID });

    expect(policy.required).toBe(true);
  });`
    : `  it('needs no approval', async () => {
    const policy = await requireTool(${symbolOf(input)}.name).approval(ctx, { recordId: RECORD_ID });

    expect(policy.required).toBe(false);
  });`;

  return `import { describe, expect, it } from 'vitest';
import { createContext } from '../../../kernel/src/context/index';
import { newId, tenantIdSchema } from '../../../kernel/src/ids/index';
import { requireTool, runToolHandler } from '../../../kernel/src/tools/index';
import { ${symbolOf(input)} } from '../tools/${input.tool.kebab}';

const RECORD_ID = '8f14e45f-ceea-467a-9f30-1b0e0b0e0001';

const ctx = createContext({
  tenantId: newId(tenantIdSchema),
  actor: { type: 'system', id: null, roles: [] },
});

describe('${toolName(input)}', () => {
  it('registers itself under its name', () => {
    expect(requireTool(${symbolOf(input)}.name).permission).toBe(${symbolOf(input)}.permission);
  });

  it('rejects input that does not match the schema', async () => {
    await expect(
      runToolHandler(ctx, requireTool(${symbolOf(input)}.name), { recordId: 'nope' }),
    ).rejects.toThrow(/Neplatný vstup/);
  });

${expectation}
});
`;
};

export const toolApprovalIntTest = (input: ToolInput): string => `import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { schema, withTenant } from '../../../kernel/src/db/index';
import {
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../kernel/src/testing/index';
import { executeTool } from '../../../kernel/src/tools/index';
import { ${symbolOf(input)} } from '../tools/${input.tool.kebab}';

const RECORD_ID = '8f14e45f-ceea-467a-9f30-1b0e0b0e0001';

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

describe('${toolName(input)} through the runtime', () => {
  it('parks the call as an approval instead of running the handler', async () => {
    const execution = await executeTool(tenant.ctx, ${symbolOf(input)}.name, { recordId: RECORD_ID });

    expect(execution.status).toBe('pending_approval');
    if (execution.status !== 'pending_approval') return;

    const rows = await withTenant(tenant.ctx, (tx) =>
      tx.select().from(schema.approval).where(eq(schema.approval.id, execution.approvalId)),
    );
    expect(rows[0]?.status).toBe('pending');
  }, 120_000);
});
`;
