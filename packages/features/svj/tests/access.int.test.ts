import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { getSvjById, listForActor, listUnits } from '../service/index';
import {
  committeeMember,
  contextOf,
  seedHouse,
  startSvjDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from './svj.fixture';

let database: TestDatabase;
let tenant: TestTenant;
let svjA: SvjId;
let svjB: SvjId;
let chairOfA: RequestContext;

beforeAll(async () => {
  database = await startSvjDb();
  tenant = await withTestTenant();
  svjA = (await seedHouse(tenant.ctx, 'SVJ A')).svj.id;
  svjB = (await seedHouse(tenant.ctx, 'SVJ B')).svj.id;
  chairOfA = contextOf(tenant, await committeeMember(tenant, svjA));
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const namesFor = async (ctx: RequestContext): Promise<readonly string[]> =>
  (await listForActor(ctx)).map((one) => one.name);

describe('what a committee member of one SVJ sees', () => {
  it('lists their own SVJ and no other', async () => {
    expect(await namesFor(chairOfA)).toEqual(['SVJ A']);
  });

  it('answers not found for an SVJ they are not on the committee of', async () => {
    await expect(getSvjById(chairOfA, svjB)).rejects.toThrow(/SVJ nenalezeno/);
  });

  it('refuses the units of that SVJ the same way', async () => {
    await expect(listUnits(chairOfA, svjB)).rejects.toThrow(/SVJ nenalezeno/);
  });
});

describe('what the SVJ scope of a credential narrows', () => {
  it('hides an SVJ outside the scope from a tenant-wide actor', async () => {
    const scoped = { ...tenant.ctx, svjScope: [svjA] };

    expect(await namesFor(scoped)).toEqual(['SVJ A']);
    await expect(getSvjById(scoped, svjB)).rejects.toThrow(/SVJ nenalezeno/);
  });

  it('keeps only what both the role and the scope allow', async () => {
    expect(await namesFor({ ...chairOfA, svjScope: [svjB] })).toEqual([]);
  });

  it('changes nothing when the scope covers everything the actor may reach', async () => {
    expect(await namesFor({ ...tenant.ctx, svjScope: [svjA, svjB] })).toEqual(['SVJ A', 'SVJ B']);
  });
});
