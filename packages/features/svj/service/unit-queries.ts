import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { UnitId } from '../domain/ids';
import type { Share } from '../domain/share';
import type { Unit } from '../domain/types';
import { unit } from '../schema';
import { reachable } from './reach';
import { toUnit } from './rows';

/**
 * A unit number is text — `2A`, `101` — but people read it as a number first, so `10` must not sort
 * between `1` and `2`. Postgres would need a collation for this; the list is one house, so it is
 * ordered here.
 */
const byUnitNumber = new Intl.Collator('cs-CZ', { numeric: true });

const unitNotFound = (unitId: UnitId): NotFoundError =>
  new NotFoundError('Jednotka nenalezena', { code: 'unit_not_found', details: { unitId } });

export const listUnits = (ctx: RequestContext, svjId: SvjId): Promise<readonly Unit[]> =>
  withTenant(ctx, async (tx) => {
    if (!(await reachable(ctx, svjId))) {
      throw new NotFoundError('SVJ nenalezeno', { code: 'svj_not_found', details: { svjId } });
    }

    const rows = await tx.select().from(unit).where(eq(unit.svjId, svjId));
    return rows.map(toUnit).sort((left, right) => byUnitNumber.compare(left.number, right.number));
  });

export const getUnitById = (ctx: RequestContext, unitId: UnitId): Promise<Unit> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(unit).where(eq(unit.id, unitId)).limit(1);
    const row = rows[0];
    if (row === undefined) throw unitNotFound(unitId);

    const found = toUnit(row);
    if (!(await reachable(ctx, found.svjId))) throw unitNotFound(unitId);
    return found;
  });

/** The share of the common parts, which is what every cost split in the platform is computed from. */
export const getShareOfUnit = async (ctx: RequestContext, unitId: UnitId): Promise<Share> =>
  (await getUnitById(ctx, unitId)).share;
