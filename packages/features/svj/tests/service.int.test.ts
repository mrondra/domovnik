import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { schema, withTenant } from '../../../kernel/src/db/index';
import { unitIdSchema } from '../domain/ids';
import { getShareOfUnit, listForActor, listUnits, getSvjById, updateSvj, updateUnit } from '../service/index';
import { seedHouse, startSvjDb, withTestTenant, type TestDatabase, type TestTenant } from './svj.fixture';

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startSvjDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const eventsNamed = (name: string): Promise<readonly { readonly svjId: string | null }[]> =>
  withTenant(tenant.ctx, (tx) =>
    tx.select({ svjId: schema.event.svjId }).from(schema.event).where(eq(schema.event.name, name)),
  );

const auditFor = (entityId: string): Promise<readonly { readonly action: string }[]> =>
  withTenant(tenant.ctx, (tx) =>
    tx
      .select({ action: schema.auditLog.action })
      .from(schema.auditLog)
      .where(eq(schema.auditLog.entityId, entityId)),
  );

describe('creating an SVJ', () => {
  it('stores the record, an audit row and the domain event', async () => {
    const { svj } = await seedHouse(tenant.ctx, 'Pod Lipami');

    expect(await getSvjById(tenant.ctx, svj.id)).toMatchObject({ name: 'Pod Lipami' });
    expect(await auditFor(svj.id)).toContainEqual({ action: 'svj.svj.created' });
    expect((await eventsNamed('svj.svj.created')).map((row) => row.svjId)).toContain(svj.id);
  });

  it('counts the units of the SVJ in the cross-SVJ listing', async () => {
    const { svj } = await seedHouse(tenant.ctx, 'Nad Strání');

    const listed = await listForActor(tenant.ctx);

    expect(listed).toContainEqual({ id: svj.id, name: 'Nad Strání', unitCount: 3 });
  });
});

describe('units', () => {
  it('lists them as people read the numbers, not as text sorts them', async () => {
    const { svj } = await seedHouse(tenant.ctx, 'U Mlýna');

    const units = await listUnits(tenant.ctx, svj.id);
    const first = units[0];

    expect(units.map((one) => one.number)).toEqual(['1', '2', '3']);
    expect(first).toBeDefined();
    expect(await getShareOfUnit(tenant.ctx, unitIdSchema.parse(first?.id))).toEqual({
      numerator: 6000,
      denominator: 15_600,
    });
  });

  it('emits svj.unit.updated with the unit as it now stands', async () => {
    const { svj } = await seedHouse(tenant.ctx, 'Na Kopci');
    const units = await listUnits(tenant.ctx, svj.id);
    const target = unitIdSchema.parse(units[0]?.id);

    const changed = await updateUnit(tenant.ctx, target, { floorArea: 65.5 });

    expect(changed.floorArea).toBe(65.5);
    expect((await eventsNamed('svj.unit.updated')).map((row) => row.svjId)).toContain(svj.id);
    expect(await auditFor(target)).toContainEqual({ action: 'svj.unit.updated' });
  });

  it('rejects a share above the whole', async () => {
    const { svj } = await seedHouse(tenant.ctx, 'V Zátiší');
    const units = await listUnits(tenant.ctx, svj.id);

    await expect(
      updateUnit(tenant.ctx, unitIdSchema.parse(units[0]?.id), {
        share: { numerator: 3, denominator: 2 },
      }),
    ).rejects.toThrow(/nesmí přesáhnout celek/);
  });
});

describe('changing the SVJ record', () => {
  it('keeps the fields it was not asked to change', async () => {
    const { svj } = await seedHouse(tenant.ctx, 'Za Vodou');

    const changed = await updateSvj(tenant.ctx, svj.id, { bankAccounts: ['9876543210/0100'] });

    expect(changed).toMatchObject({ name: 'Za Vodou', ico: svj.ico });
    expect(changed.bankAccounts).toEqual(['9876543210/0100']);
  });
});
