import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createContext } from '../context/index';
import { newId, userIdSchema, approvalIdSchema } from '../ids/index';
import { clearTools, defineTool } from '../tools/registry/index';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { createApproval } from './create';
import { getApproval, listApprovals } from './list';

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
  createApproval(tenant.ctx, { toolName: 'letter.send', input: { to: 'Novák' }, evidence: {}, approvers });

const asUser = (id: string, roles: readonly ['manager'] | readonly ['owner']) =>
  createContext({ tenantId: tenant.tenantId, actor: { type: 'user', id: userIdSchema.parse(id), roles } });

describe('listApprovals', () => {
  it('shows an approval addressed to nobody in particular', async () => {
    const id = await pending([]);
    expect((await listApprovals(tenant.ctx)).map((row) => row.id)).toContain(id);
  });

  it('hides an approval addressed to someone else', async () => {
    const id = await pending([newId(userIdSchema)]);
    expect((await listApprovals(tenant.ctx)).map((row) => row.id)).not.toContain(id);
  });

  it('shows an approval addressed to the actor', async () => {
    const id = await pending([tenant.adminId]);
    const manager = asUser(tenant.adminId, ['manager']);
    expect((await listApprovals(manager)).map((row) => row.id)).toContain(id);
  });

  it('leaves the inbox of an actor who may not decide empty', async () => {
    await pending([]);
    expect(await listApprovals(asUser(tenant.adminId, ['owner']))).toEqual([]);
  });
});

describe('getApproval', () => {
  it('returns the evidence the decision page needs', async () => {
    const id = await pending([tenant.adminId]);
    const detail = await getApproval(tenant.ctx, id);

    expect(detail.toolName).toBe('letter.send');
    expect(detail.input).toEqual({ to: 'Novák' });
    expect(detail.status).toBe('pending');
  });

  it('reports an approval that does not exist', async () => {
    await expect(getApproval(tenant.ctx, newId(approvalIdSchema))).rejects.toThrow(/nenalezeno/);
  });
});
