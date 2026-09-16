import type { RequestContext } from '../../../kernel/src/context/index';
import { user } from '../../../kernel/src/db/schema/index';
import { withTenant } from '../../../kernel/src/db/index';
import { createUser, ROLES, type Role } from '../../../kernel/src/identity/index';

const DEMO_PASSWORD = 'domovnik-demo';
const DOMAIN = 'demo.domovnik.test';

/** Invented people on a reserved domain — the seed never carries anything real (AGENTS.md §7). */
const DISPLAY_NAMES: Readonly<Record<Role, string>> = {
  tenant_admin: 'Alena Správcová',
  manager: 'Martin Pokorný',
  finance: 'Filip Účetní',
  technician: 'Tomáš Technik',
  committee: 'Karel Předseda',
  owner: 'Olga Vlastníková',
  agent_author: 'Adam Autor',
};

/** The stable key of a demo user, which is also how a test recognises the kernel's own rows. */
export const demoUserEmail = (role: Role): string => `${role.replace('_', '-')}@${DOMAIN}`;

/** Idempotent by e-mail: one user per role, re-running the seed adds nobody. */
export const seedDemoUsers = async (ctx: RequestContext): Promise<number> => {
  const present = await withTenant(ctx, (tx) => tx.select({ email: user.email }).from(user));
  const known = new Set(present.map((row) => row.email));
  const missing = ROLES.filter((role) => !known.has(demoUserEmail(role)));

  for (const role of missing) {
    await createUser(ctx, {
      email: demoUserEmail(role),
      displayName: DISPLAY_NAMES[role],
      password: DEMO_PASSWORD,
      roles: [role],
    });
  }

  return missing.length;
};
