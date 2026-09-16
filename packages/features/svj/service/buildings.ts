import { asc, eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { newId } from '../../../kernel/src/ids/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { buildingIdSchema, type BuildingId } from '../domain/ids';
import type { Building, CreateBuildingInput } from '../domain/types';
import { building } from '../schema';
import { reachable } from './reach';
import { toBuilding } from './rows';

export const createBuilding = (ctx: RequestContext, input: CreateBuildingInput): Promise<Building> => {
  const created: Building = {
    id: newId(buildingIdSchema),
    svjId: input.svjId,
    label: input.label,
    street: input.street,
  };

  return withTenant(ctx, async (tx) => {
    await tx.insert(building).values({
      id: created.id,
      tenantId: ctx.tenantId,
      svjId: created.svjId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      label: created.label,
      street: created.street,
    });

    await audit.record(ctx, {
      action: 'svj.building.created',
      entity: 'building',
      entityId: created.id,
      reason: 'Založena budova',
      after: { svjId: created.svjId, label: created.label },
    });

    return created;
  });
};

export const listBuildings = (ctx: RequestContext, svjId: SvjId): Promise<readonly Building[]> =>
  withTenant(ctx, async (tx) => {
    if (!(await reachable(ctx, svjId))) {
      throw new NotFoundError('SVJ nenalezeno', { code: 'svj_not_found', details: { svjId } });
    }

    const rows = await tx
      .select()
      .from(building)
      .where(eq(building.svjId, svjId))
      .orderBy(asc(building.label));

    return rows.map(toBuilding);
  });

export const requireBuilding = (ctx: RequestContext, buildingId: BuildingId): Promise<Building> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(building).where(eq(building.id, buildingId)).limit(1);
    const row = rows[0];
    if (row === undefined) {
      throw new NotFoundError('Budova nenalezena', {
        code: 'building_not_found',
        details: { buildingId },
      });
    }
    return toBuilding(row);
  });
