import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DomainError } from '../../../kernel/src/errors/index';
import { createUser } from '../../../kernel/src/identity/index';
import type { Unit } from '../domain/types';
import {
  departmentByCode,
  listDepartments,
  listForActor,
  membersOf,
  listUnits,
  svjSummary,
} from '../service/index';
import { DEMO_DEPARTMENTS, DEMO_SVJ } from '../seed/data';
import { svjSeed } from '../seed/svj.seed';
import { startSvjDb, withTestTenant, type TestDatabase, type TestTenant } from './svj.fixture';

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startSvjDb();
  tenant = await withTestTenant();
  await svjSeed.run({ tenantId: tenant.tenantId, ctx: tenant.ctx });
}, 180_000);

afterAll(async () => {
  await database.stop();
});

/** The 12-unit house of zadání kap. 10; small enough to assert every unit of it. */
const unitsOfSmallest = async (): Promise<readonly Unit[]> => {
  const smallest = [...(await svjSummary(tenant.ctx))].sort((a, b) => a.unitCount - b.unitCount)[0];
  if (smallest === undefined) throw new DomainError('Seed nezaložil žádné SVJ');
  return listUnits(tenant.ctx, smallest.id);
};

describe('the demo seed', () => {
  it('seats people by role and adds nobody on a second run', async () => {
    const roles = ['finance', 'technician', 'manager'] as const;
    const [fin, tech, boss] = await Promise.all(
      roles.map((role) =>
        createUser(tenant.ctx, {
          email: `${role}@seed.test`,
          displayName: role,
          password: 'x'.repeat(12),
          roles: [role],
        }),
      ),
    );
    await svjSeed.run({ tenantId: tenant.tenantId, ctx: tenant.ctx });
    await svjSeed.run({ tenantId: tenant.tenantId, ctx: tenant.ctx });

    const membersByCode = async (code: string) =>
      membersOf(tenant.ctx, (await departmentByCode(tenant.ctx, code)).id);
    expect(await membersByCode('finance')).toEqual([fin]);
    expect(await membersByCode('technicians')).toEqual([tech]);
    expect(await membersByCode('maintenance')).toEqual([tech]);
    const administration = await membersByCode('administration');
    expect(administration).toContain(boss);
    expect(new Set(administration).size).toBe(administration.length);
  });

  it('writes the three SVJ of zadání kap. 10 with their unit counts', async () => {
    const seeded = await listForActor(tenant.ctx);

    expect(seeded.map((one) => one.unitCount).sort((left, right) => left - right)).toEqual([12, 40, 80]);
    expect(seeded).toHaveLength(DEMO_SVJ.length);
  });

  it('writes the departments of the management company', async () => {
    expect((await listDepartments(tenant.ctx)).map((one) => one.code).sort()).toEqual(
      DEMO_DEPARTMENTS.map((one) => one.code).sort(),
    );
  });

  it('gives every unit of an SVJ a share of the same whole', async () => {
    const units = await unitsOfSmallest();
    const denominators = new Set(units.map((one) => one.share.denominator));
    const total = units.reduce((sum, one) => sum + one.share.numerator, 0);

    expect(denominators.size).toBe(1);
    expect(total).toBe(units[0]?.share.denominator);
  });

  it('numbers the units of the smallest house from one to twelve', async () => {
    expect((await unitsOfSmallest()).map((one) => one.number)).toEqual(
      Array.from({ length: 12 }, (_unused, index) => String(index + 1)),
    );
  });

  it('adds nothing on a second run', async () => {
    await svjSeed.run({ tenantId: tenant.tenantId, ctx: tenant.ctx });

    expect(await listForActor(tenant.ctx)).toHaveLength(DEMO_SVJ.length);
    expect(await listDepartments(tenant.ctx)).toHaveLength(DEMO_DEPARTMENTS.length);
  });
});
