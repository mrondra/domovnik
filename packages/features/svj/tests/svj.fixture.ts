import { createContext, type RequestContext } from '../../../kernel/src/context/index';
import { createUser } from '../../../kernel/src/identity/index';
import type { SvjId, UserId } from '../../../kernel/src/ids/index';
import { startTestDb, withTestTenant } from '../../../kernel/src/testing/index';
import type { TestDatabase, TestTenant } from '../../../kernel/src/testing/index';
import { share } from '../domain/share';
import type { Svj } from '../domain/types';
import { building, department, svj, unit, unitKindEnum } from '../schema';
import { createBuilding, createSvj, createUnit } from '../service/index';

export const featureSchema = { svj, building, unit, department, unitKindEnum };

export const startSvjDb = (): Promise<TestDatabase> => startTestDb(featureSchema);

export interface Seeded {
  readonly svj: Svj;
  readonly unitNumbers: readonly string[];
}

let sequence = 0;

/** One house with three units, which is enough to prove a share, a listing and an isolation rule. */
export const seedHouse = async (ctx: RequestContext, name: string): Promise<Seeded> => {
  sequence += 1;
  const created = await createSvj(ctx, {
    name,
    ico: String(10_000_000 + sequence),
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
    bankAccounts: ['1234567890/2010'],
  });

  const house = await createBuilding(ctx, {
    svjId: created.id,
    label: 'Vchod A',
    street: 'Krátká 1',
  });

  const plan = [
    { number: '1', kind: 'apartment', floorArea: 60, numerator: 6000 },
    { number: '2', kind: 'apartment', floorArea: 80, numerator: 8000 },
    { number: '3', kind: 'garage', floorArea: 16, numerator: 1600 },
  ] as const;

  for (const one of plan) {
    await createUnit(ctx, {
      svjId: created.id,
      buildingId: house.id,
      number: one.number,
      kind: one.kind,
      share: share(one.numerator, 15_600),
      floorArea: one.floorArea,
    });
  }

  return { svj: created, unitNumbers: plan.map((one) => one.number) };
};

export const committeeMember = async (tenant: TestTenant, svjId: SvjId): Promise<UserId> => {
  sequence += 1;
  return createUser(tenant.ctx, {
    email: `vybor${String(sequence)}@example.test`,
    displayName: 'Člen výboru',
    password: 'test-password',
    roles: ['committee'],
    svjId,
  });
};

export const contextOf = (tenant: TestTenant, userId: UserId, svjScope?: readonly SvjId[]): RequestContext =>
  createContext({
    tenantId: tenant.tenantId,
    actor: { type: 'user', id: userId, roles: ['committee'] },
    svjScope,
  });

export { withTestTenant };
export type { TestDatabase, TestTenant };
