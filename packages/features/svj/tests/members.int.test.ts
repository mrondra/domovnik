import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { schema, withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { createUser } from '../../../kernel/src/identity/index';
import { newId } from '../../../kernel/src/ids/index';
import type { UserId } from '../../../kernel/src/ids/index';
import { departmentIdSchema } from '../domain/ids';
import {
  addDepartmentMember,
  createDepartment,
  departmentByCode,
  departmentsOf,
  membersOf,
} from '../service/index';
import { startSvjDb, withTestTenant, type TestDatabase, type TestTenant } from './svj.fixture';

let database: TestDatabase;
let tenant: TestTenant;
let other: TestTenant;

beforeAll(async () => {
  database = await startSvjDb();
  tenant = await withTestTenant();
  other = await withTestTenant();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const person = (ctx: TestTenant['ctx'], email: string): Promise<UserId> =>
  createUser(ctx, { email, displayName: email, password: 'x'.repeat(12), roles: ['technician'] });

const memberAudits = async (): Promise<number> =>
  (
    await withTenant(tenant.ctx, (tx) =>
      tx
        .select({ id: schema.auditLog.id })
        .from(schema.auditLog)
        .where(eq(schema.auditLog.action, 'svj.department.member_added')),
    )
  ).length;

describe('department members', () => {
  it('lists a person in the departments they were added to and the department by its members', async () => {
    const fin = await createDepartment(tenant.ctx, { code: 'finance', name: 'Finance' });
    const tech = await createDepartment(tenant.ctx, { code: 'technicians', name: 'Technici' });
    const karel = await person(tenant.ctx, 'karel@m.test');
    const jana = await person(tenant.ctx, 'jana@m.test');

    await addDepartmentMember(tenant.ctx, fin.id, karel);
    await addDepartmentMember(tenant.ctx, tech.id, karel);
    await addDepartmentMember(tenant.ctx, tech.id, jana);

    expect((await departmentsOf(tenant.ctx, karel)).map((one) => one.code)).toEqual([
      'finance',
      'technicians',
    ]);
    expect([...(await membersOf(tenant.ctx, tech.id))].sort()).toEqual([jana, karel].sort());
  });

  it('adds the same person twice without a second row or a second audit entry', async () => {
    const dept = await createDepartment(tenant.ctx, { code: 'cleaning', name: 'Úklid' });
    const user = await person(tenant.ctx, 'dup@m.test');

    const first = await addDepartmentMember(tenant.ctx, dept.id, user);
    const auditedAfterFirst = await memberAudits();
    const second = await addDepartmentMember(tenant.ctx, dept.id, user);

    expect([first.created, second.created]).toEqual([true, false]);
    expect(await membersOf(tenant.ctx, dept.id)).toEqual([user]);
    expect(await memberAudits()).toBe(auditedAfterFirst);
    expect(await departmentsOf(tenant.ctx, user)).toHaveLength(1);
  });

  it('finds a department by code and says not found for an unknown one', async () => {
    const dept = await departmentByCode(tenant.ctx, 'finance');

    expect(dept.name).toBe('Finance');
    await expect(departmentByCode(tenant.ctx, 'nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('refuses a department that does not exist and hides departments of another tenant', async () => {
    const user = await person(tenant.ctx, 'ghost@m.test');

    await expect(addDepartmentMember(tenant.ctx, newId(departmentIdSchema), user)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(departmentByCode(other.ctx, 'finance')).rejects.toBeInstanceOf(NotFoundError);
  });
});
