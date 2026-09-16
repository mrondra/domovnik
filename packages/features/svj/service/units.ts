import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { DomainError } from '../../../kernel/src/errors/index';
import { events } from '../../../kernel/src/events/index';
import { newId } from '../../../kernel/src/ids/index';
import { unitIdSchema, type UnitId } from '../domain/ids';
import { unitUpdated } from '../domain/events';
import { share } from '../domain/share';
import type { CreateUnitInput, Unit, UpdateUnitInput } from '../domain/types';
import { unit } from '../schema';
import { requireBuilding } from './buildings';
import { asNumeric } from './rows';
import { getUnitById } from './unit-queries';

export const createUnit = (ctx: RequestContext, input: CreateUnitInput): Promise<Unit> => {
  const created: Unit = {
    ...input,
    id: newId(unitIdSchema),
    share: share(input.share.numerator, input.share.denominator),
  };

  return withTenant(ctx, async (tx) => {
    const building = await requireBuilding(ctx, input.buildingId);
    if (building.svjId !== input.svjId) {
      throw new DomainError('Budova patří jinému SVJ', {
        code: 'building_of_another_svj',
        details: { buildingId: input.buildingId, svjId: input.svjId },
      });
    }

    await tx.insert(unit).values({
      id: created.id,
      tenantId: ctx.tenantId,
      svjId: created.svjId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      buildingId: created.buildingId,
      number: created.number,
      kind: created.kind,
      shareNumerator: created.share.numerator,
      shareDenominator: created.share.denominator,
      floorArea: asNumeric(created.floorArea),
    });

    await audit.record(ctx, {
      action: 'svj.unit.created',
      entity: 'unit',
      entityId: created.id,
      reason: 'Založena jednotka',
      after: { svjId: created.svjId, number: created.number },
    });

    return created;
  });
};

export const updateUnit = (ctx: RequestContext, unitId: UnitId, input: UpdateUnitInput): Promise<Unit> =>
  withTenant(ctx, async (tx) => {
    const before = await getUnitById(ctx, unitId);
    const after: Unit = {
      ...before,
      kind: input.kind ?? before.kind,
      share: input.share === undefined ? before.share : share(input.share.numerator, input.share.denominator),
      floorArea: input.floorArea ?? before.floorArea,
    };

    await tx
      .update(unit)
      .set({
        kind: after.kind,
        shareNumerator: after.share.numerator,
        shareDenominator: after.share.denominator,
        floorArea: asNumeric(after.floorArea),
        updatedAt: new Date(),
      })
      .where(eq(unit.id, unitId));

    await audit.record(ctx, {
      action: 'svj.unit.updated',
      entity: 'unit',
      entityId: unitId,
      reason: 'Změna jednotky',
      before: { kind: before.kind, share: before.share, floorArea: before.floorArea },
      after: { kind: after.kind, share: after.share, floorArea: after.floorArea },
    });

    await events.emit(
      withSvj(ctx, after.svjId),
      unitUpdated.create({
        svjId: after.svjId,
        unitId,
        number: after.number,
        kind: after.kind,
        share: after.share,
        floorArea: after.floorArea,
      }),
    );

    return after;
  });
