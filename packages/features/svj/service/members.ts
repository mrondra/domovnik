import { asc, eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { newRowId, userIdSchema, type UserId } from '../../../kernel/src/ids/index';
import type { DepartmentId } from '../domain/ids';
import type { Department, DepartmentMembership } from '../domain/types';
import { department, departmentMember } from '../schema';
import { toDepartment } from './rows';

const departmentNotFound = (details: Record<string, string>): NotFoundError =>
  new NotFoundError('Oddělení nenalezeno', { code: 'department_not_found', details });

export const departmentByCode = (ctx: RequestContext, code: string): Promise<Department> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(department).where(eq(department.code, code)).limit(1);
    const found = rows[0];
    if (found === undefined) throw departmentNotFound({ code });
    return toDepartment(found);
  });

/** Adding someone who already sits in the department changes nothing and leaves no audit row. */
export const addDepartmentMember = (
  ctx: RequestContext,
  departmentId: DepartmentId,
  userId: UserId,
): Promise<DepartmentMembership> =>
  withTenant(ctx, async (tx) => {
    const known = await tx
      .select({ id: department.id })
      .from(department)
      .where(eq(department.id, departmentId));
    if (known.length === 0) throw departmentNotFound({ departmentId });

    const id = newRowId();
    const inserted = await tx
      .insert(departmentMember)
      .values({
        id,
        tenantId: ctx.tenantId,
        createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
        departmentId,
        userId,
      })
      .onConflictDoNothing()
      .returning({ id: departmentMember.id });

    if (inserted.length > 0) {
      await audit.record(ctx, {
        action: 'svj.department.member_added',
        entity: 'department_member',
        entityId: id,
        reason: 'Přidán člen oddělení',
        after: { departmentId, userId },
      });
    }

    return { departmentId, userId, created: inserted.length > 0 };
  });

export const departmentsOf = (ctx: RequestContext, userId: UserId): Promise<readonly Department[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ id: department.id, code: department.code, name: department.name })
      .from(departmentMember)
      .innerJoin(department, eq(department.id, departmentMember.departmentId))
      .where(eq(departmentMember.userId, userId))
      .orderBy(asc(department.name));
    return rows.map(toDepartment);
  });

export const membersOf = (ctx: RequestContext, departmentId: DepartmentId): Promise<readonly UserId[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ userId: departmentMember.userId })
      .from(departmentMember)
      .where(eq(departmentMember.departmentId, departmentId))
      .orderBy(asc(departmentMember.createdAt));
    return rows.map((row) => userIdSchema.parse(row.userId));
  });
