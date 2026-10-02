import type { RequestContext } from '../../../kernel/src/context/index';
import { usersWithRole } from '../../../kernel/src/identity/index';
import { addDepartmentMember, departmentByCode } from '../service/index';
import { DEMO_MEMBERSHIPS } from './data';

/**
 * Seats the people who already exist by their role (zadání kap. 4). Adding a seated person is a
 * no-op in the service, so a re-run adds nothing; a tenant without such users gets nothing.
 */
export const seedDepartmentMembers = async (ctx: RequestContext): Promise<void> => {
  for (const { role, departments } of DEMO_MEMBERSHIPS) {
    const users = await usersWithRole(ctx, role);
    if (users.length === 0) continue;

    for (const code of departments) {
      const found = await departmentByCode(ctx, code);
      for (const userId of users) await addDepartmentMember(ctx, found.id, userId);
    }
  }
};
