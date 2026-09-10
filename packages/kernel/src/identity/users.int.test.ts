import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { authenticate, createUser, requireUser, rolesOf } from './service/index';

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

describe('users', () => {
  it('stores roles and finds the user again', async () => {
    const userId = await createUser(tenant.ctx, {
      email: 'finance@example.test',
      displayName: 'Finance',
      password: 'heslo-12345',
      roles: ['finance', 'committee'],
    });

    expect(await rolesOf(tenant.ctx, userId)).toEqual(['finance', 'committee']);
    expect((await requireUser(tenant.ctx, userId)).email).toBe('finance@example.test');
  });

  it('reports an unknown user', async () => {
    await expect(requireUser(tenant.ctx, crypto.randomUUID() as never)).rejects.toThrow(/nenalezen/);
  });
});

describe('authenticate', () => {
  it('resolves the tenant and roles from the credentials', async () => {
    await createUser(tenant.ctx, {
      email: 'manager@example.test',
      displayName: 'Správce',
      password: 'heslo-12345',
      roles: ['manager'],
    });

    const authenticated = await authenticate('manager@example.test', 'heslo-12345');
    expect(authenticated.tenantId).toBe(tenant.tenantId);
    expect(authenticated.roles).toEqual(['manager']);
  });

  it('rejects a wrong password and an unknown e-mail alike', async () => {
    await expect(authenticate('manager@example.test', 'špatné')).rejects.toThrow(
      /Neplatné přihlašovací údaje/,
    );
    await expect(authenticate('nobody@example.test', 'heslo-12345')).rejects.toThrow(
      /Neplatné přihlašovací údaje/,
    );
  });
});
