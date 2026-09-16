import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newId } from '../../../kernel/src/ids/index';
import { buildingIdSchema, unitIdSchema, type BuildingId, type UnitId } from '../domain/ids';
import { share } from '../domain/share';
import type { Svj, Unit } from '../domain/types';
import { SvjService } from '../service/index';
import { startSvjDb, withTestTenant, type TestDatabase, type TestTenant } from './svj.fixture';

const service = new SvjService();

let database: TestDatabase;
let tenant: TestTenant;
let house: Svj;
let firstUnit: UnitId;

beforeAll(async () => {
  database = await startSvjDb();
  tenant = await withTestTenant();
  house = await service.createSvj(tenant.ctx, {
    name: 'Pod Kaštany',
    ico: '26134586',
    address: { street: 'Pod Kaštany 3', city: 'Praha 6', postalCode: '160 00' },
  });

  const building = await service.createBuilding(tenant.ctx, {
    svjId: house.id,
    label: 'Vchod A',
    street: 'Pod Kaštany 3',
  });
  const unit = await service.createUnit(tenant.ctx, {
    svjId: house.id,
    buildingId: building.id,
    number: '1',
    kind: 'apartment',
    share: share(1, 2),
    floorArea: 55,
  });
  firstUnit = unit.id;
}, 120_000);

afterAll(async () => {
  await database.stop();
});

describe('what the injectable service answers', () => {
  it('reads back the SVJ it created', async () => {
    expect(await service.getById(tenant.ctx, house.id)).toMatchObject({ name: 'Pod Kaštany' });
    expect(await service.listForActor(tenant.ctx)).toMatchObject([{ name: 'Pod Kaštany', unitCount: 1 }]);
  });

  it('lists the buildings and the units of the SVJ', async () => {
    expect(await service.listBuildings(tenant.ctx, house.id)).toMatchObject([{ label: 'Vchod A' }]);
    expect(await service.listUnits(tenant.ctx, house.id)).toHaveLength(1);
    expect(await service.getUnit(tenant.ctx, firstUnit)).toMatchObject({ number: '1' });
    expect(await service.getShareOfUnit(tenant.ctx, firstUnit)).toEqual({ numerator: 1, denominator: 2 });
  });

  it('changes a unit and the SVJ record', async () => {
    expect(await service.updateUnit(tenant.ctx, firstUnit, { kind: 'commercial' })).toMatchObject({
      kind: 'commercial',
    });
    expect(await service.updateSvj(tenant.ctx, house.id, { name: 'Pod Kaštany 3' })).toMatchObject({
      name: 'Pod Kaštany 3',
    });
  });

  it('keeps the departments of the management company', async () => {
    await service.createDepartment(tenant.ctx, { code: 'cleaning', name: 'Úklid' });

    expect(await service.listDepartments(tenant.ctx)).toMatchObject([{ code: 'cleaning' }]);
  });
});

const garageIn = (buildingId: BuildingId, number: string): Promise<Unit> =>
  service.createUnit(tenant.ctx, {
    svjId: house.id,
    buildingId,
    number,
    kind: 'garage',
    share: share(1, 100),
    floorArea: 16,
  });

describe('what the service refuses', () => {
  it('refuses a unit in a building that does not exist', async () => {
    await expect(garageIn(newId(buildingIdSchema), '99')).rejects.toThrow(/Budova nenalezena/);
  });

  it('refuses a unit in a building of another SVJ', async () => {
    const other = await service.createSvj(tenant.ctx, {
      name: 'Jiné SVJ',
      ico: '27309452',
      address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
    });
    const elsewhere = await service.createBuilding(tenant.ctx, {
      svjId: other.id,
      label: 'Vchod B',
      street: 'Krátká 1',
    });

    await expect(garageIn(elsewhere.id, '98')).rejects.toThrow(/Budova patří jinému SVJ/);
  });

  it('refuses to read a unit that does not exist', async () => {
    await expect(service.getUnit(tenant.ctx, newId(unitIdSchema))).rejects.toThrow(/Jednotka nenalezena/);
  });
});
