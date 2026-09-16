import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createContext, type RequestContext } from '../context/index';
import { newId, svjIdSchema, type SvjId, type UserId } from '../ids/index';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { accessibleSvj, createUser, reachableSvj } from './service/index';

const SVJ_A: SvjId = newId(svjIdSchema);
const SVJ_B: SvjId = newId(svjIdSchema);

let database: TestDatabase;
let tenant: TestTenant;
let chairId: UserId;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
  chairId = await createUser(tenant.ctx, {
    email: 'predseda@example.test',
    displayName: 'Předseda',
    password: 'test-password',
    roles: ['committee'],
    svjId: SVJ_A,
  });
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const contextFor = (userId: UserId, svjScope?: readonly SvjId[]): RequestContext =>
  createContext({
    tenantId: tenant.tenantId,
    actor: { type: 'user', id: userId, roles: ['committee'] },
    svjScope,
  });

describe('accessibleSvj', () => {
  it('answers null for a role held across the whole tenant', async () => {
    expect(await accessibleSvj(tenant.ctx, tenant.adminId)).toBeNull();
  });

  it('answers the listed SVJ for a role held in one of them', async () => {
    expect(await accessibleSvj(tenant.ctx, chairId)).toEqual([SVJ_A]);
  });
});

describe('reachableSvj', () => {
  it('leaves a tenant-wide actor unnarrowed when the credential carries no scope', async () => {
    expect(await reachableSvj(tenant.ctx)).toBeNull();
  });

  it('narrows a tenant-wide actor to the scope of the credential', async () => {
    expect(await reachableSvj(contextFor(tenant.adminId, [SVJ_B]))).toEqual([SVJ_B]);
  });

  it('keeps only what both the actor and the credential allow', async () => {
    expect(await reachableSvj(contextFor(chairId, [SVJ_A, SVJ_B]))).toEqual([SVJ_A]);
  });

  it('answers nothing when the credential names an SVJ the actor cannot reach', async () => {
    expect(await reachableSvj(contextFor(chairId, [SVJ_B]))).toEqual([]);
  });

  it('does not narrow a system actor', async () => {
    const system = createContext({
      tenantId: tenant.tenantId,
      actor: { type: 'system', id: null, roles: [] },
    });
    expect(await reachableSvj(system)).toBeNull();
  });
});
