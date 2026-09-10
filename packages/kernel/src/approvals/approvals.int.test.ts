import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createContext } from '../context/index';
import { approval } from '../db/schema/index';
import { withTenant } from '../db/tenant';
import { newId, approvalIdSchema, userIdSchema } from '../ids/index';
import { clearTools, defineTool } from '../tools/registry/index';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { approvals } from './index';
import { createApproval } from './create';

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
  clearTools();
  defineTool({
    name: 'letter.send',
    description: 'Odešle dopis vlastníkovi.',
    input: z.object({}),
    output: z.object({ sent: z.boolean() }),
    permission: 'comms.send',
    approval: () => ({ required: true, approvers: [] }),
    userComposable: false,
    readOnly: false,
    handler: () => Promise.resolve({ sent: true }),
  });
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const pending = (approvers: readonly string[]) =>
  createApproval(tenant.ctx, {
    toolName: 'letter.send',
    input: {},
    evidence: {},
    approvers,
  });

describe('approvals.decide', () => {
  it('rejects a decision from someone who is not an approver', async () => {
    const id = await pending([newId(userIdSchema)]);
    await expect(approvals.decide(tenant.ctx, id, 'approved')).rejects.toThrow(/není mezi schvalovateli/);
  });

  it('rejects a decision from an actor without the permission', async () => {
    const id = await pending([]);
    const owner = createContext({
      tenantId: tenant.tenantId,
      actor: { type: 'user', id: tenant.adminId, roles: ['owner'] },
    });
    await expect(approvals.decide(owner, id, 'approved')).rejects.toThrow(/nesmí schvalovat/);
  });

  it('reports a decision on an approval that does not exist', async () => {
    await expect(approvals.decide(tenant.ctx, newId(approvalIdSchema), 'approved')).rejects.toThrow(
      /neexistuje/,
    );
  });

  it('accepts the decision of a listed approver', async () => {
    const id = await pending([tenant.adminId]);
    expect((await approvals.decide(tenant.ctx, id, 'approved')).output).toEqual({ sent: true });
  });
});

describe('approvals.expire', () => {
  it('expires only what is past its deadline and still pending', async () => {
    const overdue = await createApproval(tenant.ctx, {
      toolName: 'letter.send',
      input: {},
      evidence: {},
      approvers: [],
      deadline: new Date(Date.now() - 1000),
    });
    const open = await pending([]);

    expect(await approvals.expire(tenant.ctx)).toBe(1);

    const rows = await withTenant(tenant.ctx, (tx) => tx.select().from(approval));
    expect(rows.find((row) => row.id === overdue)?.status).toBe('expired');
    expect(rows.find((row) => row.id === open)?.status).toBe('pending');
  });
});
