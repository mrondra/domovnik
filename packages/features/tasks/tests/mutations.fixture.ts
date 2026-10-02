import { eq } from 'drizzle-orm';
import { createContext, type RequestContext } from '../../../kernel/src/context/index';
import { schema, withTenant } from '../../../kernel/src/db/index';
import { createUser } from '../../../kernel/src/identity/index';
import type { SvjId, UserId } from '../../../kernel/src/ids/index';
import { SvjService } from '../../svj/index';
import { task, taskActivity } from '../schema';
import { withTestTenant, type TestTenant } from './tasks.fixture';

export interface World {
  readonly tenant: TestTenant;
  readonly svjA: SvjId;
  readonly svjB: SvjId;
  readonly departmentId: string;
}

let sequence = 0;

const house = (ctx: RequestContext, name: string): Promise<SvjId> => {
  sequence += 1;
  return new SvjService()
    .createSvj(ctx, {
      name,
      ico: String(20_000_000 + sequence),
      address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
      bankAccounts: ['1234567890/2010'],
    })
    .then((created) => created.id);
};

/** One tenant with two houses and the `finance` department, enough for every mutation and rule. */
export const seedWorld = async (): Promise<World> => {
  const tenant = await withTestTenant();
  const departmentId = (
    await new SvjService().createDepartment(tenant.ctx, { code: 'finance', name: 'Finance' })
  ).id;
  return {
    tenant,
    svjA: await house(tenant.ctx, 'SVJ A'),
    svjB: await house(tenant.ctx, 'SVJ B'),
    departmentId,
  };
};

export const personIn = async (
  tenant: TestTenant,
  role: 'technician' | 'committee',
  svjId?: SvjId,
): Promise<RequestContext> => {
  sequence += 1;
  const id: UserId = await createUser(tenant.ctx, {
    email: `osoba${String(sequence)}@example.test`,
    displayName: 'Osoba',
    password: 'test-password',
    roles: [role],
    ...(svjId === undefined ? {} : { svjId }),
  });
  return createContext({ tenantId: tenant.tenantId, actor: { type: 'user', id, roles: [role] } });
};

export const eventsNamed = async (ctx: RequestContext, name: string): Promise<number> =>
  (
    await withTenant(ctx, (tx) =>
      tx.select({ id: schema.event.id }).from(schema.event).where(eq(schema.event.name, name)),
    )
  ).length;

export const auditsNamed = async (ctx: RequestContext, action: string): Promise<number> =>
  (
    await withTenant(ctx, (tx) =>
      tx.select({ id: schema.auditLog.id }).from(schema.auditLog).where(eq(schema.auditLog.action, action)),
    )
  ).length;

export const rowsOf = (
  ctx: RequestContext,
): Promise<{ tasks: (typeof task.$inferSelect)[]; activity: (typeof taskActivity.$inferSelect)[] }> =>
  withTenant(ctx, async (tx) => ({
    tasks: await tx.select().from(task),
    activity: await tx.select().from(taskActivity),
  }));
