import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiToken } from '../../../../packages/kernel/src/identity/index';
import { newId, svjIdSchema, type SvjId } from '../../../../packages/kernel/src/ids/index';
import { startTestDb, withTestTenant } from '../../../../packages/kernel/src/testing/index';
import type { TestDatabase, TestTenant } from '../../../../packages/kernel/src/testing/index';
import { authenticate } from '../server/principal';

const SCOPED: readonly SvjId[] = [newId(svjIdSchema)];

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const issue = (svjScope?: readonly SvjId[]): Promise<string> =>
  createApiToken(tenant.ctx, {
    name: 'MCP',
    ownerUserId: tenant.adminId,
    allowedTools: [],
    svjScope,
  }).then((issued) => issued.token);

describe('the context a token connects with', () => {
  it('carries the SVJ scope of the token, so a tool can narrow by it', async () => {
    const principal = await authenticate(`Bearer ${await issue(SCOPED)}`);

    expect(principal.ctx.svjScope).toEqual(SCOPED);
  });

  it('carries no scope for a token issued for the whole tenant', async () => {
    const principal = await authenticate(`Bearer ${await issue()}`);

    expect(principal.ctx.svjScope).toBeUndefined();
  });
});
