import { asc } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { newId } from '../../../kernel/src/ids/index';
import { departmentIdSchema } from '../domain/ids';
import type { Department } from '../domain/types';
import { department } from '../schema';
import { toDepartment } from './rows';

export interface CreateDepartmentInput {
  readonly code: string;
  readonly name: string;
}

/**
 * Departments belong to the management company, so they are tenant-scoped and every signed-in person
 * of the tenant sees the same list — there is nothing here to narrow by SVJ.
 */
export const listDepartments = (ctx: RequestContext): Promise<readonly Department[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(department).orderBy(asc(department.name));
    return rows.map(toDepartment);
  });

export const createDepartment = (ctx: RequestContext, input: CreateDepartmentInput): Promise<Department> => {
  const created: Department = { id: newId(departmentIdSchema), code: input.code, name: input.name };

  return withTenant(ctx, async (tx) => {
    await tx.insert(department).values({
      id: created.id,
      tenantId: ctx.tenantId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      code: created.code,
      name: created.name,
    });

    await audit.record(ctx, {
      action: 'svj.department.created',
      entity: 'department',
      entityId: created.id,
      reason: 'Založeno oddělení',
      after: { code: created.code, name: created.name },
    });

    return created;
  });
};
