import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { UnitId } from '../domain/ids';
import type { Share } from '../domain/share';
import type {
  Building,
  CreateBuildingInput,
  CreateSvjInput,
  CreateUnitInput,
  Department,
  Svj,
  SvjSummary,
  Unit,
  UpdateSvjInput,
  UpdateUnitInput,
} from '../domain/types';
import { createBuilding, listBuildings } from './buildings';
import { createDepartment, listDepartments, type CreateDepartmentInput } from './departments';
import { createSvj, getSvjById } from './svj-records';
import { updateSvj } from './svj-updates';
import { listForActor } from './summaries';
import { getShareOfUnit, getUnitById, listUnits } from './unit-queries';
import { createUnit, updateUnit } from './units';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a tool or a seed can call the same function without going through Nest.
 */
@Injectable()
export class SvjService {
  createSvj(ctx: RequestContext, input: CreateSvjInput): Promise<Svj> {
    return createSvj(ctx, input);
  }

  getById(ctx: RequestContext, svjId: SvjId): Promise<Svj> {
    return getSvjById(ctx, svjId);
  }

  updateSvj(ctx: RequestContext, svjId: SvjId, input: UpdateSvjInput): Promise<Svj> {
    return updateSvj(ctx, svjId, input);
  }

  listForActor(ctx: RequestContext): Promise<readonly SvjSummary[]> {
    return listForActor(ctx);
  }

  createBuilding(ctx: RequestContext, input: CreateBuildingInput): Promise<Building> {
    return createBuilding(ctx, input);
  }

  listBuildings(ctx: RequestContext, svjId: SvjId): Promise<readonly Building[]> {
    return listBuildings(ctx, svjId);
  }

  createUnit(ctx: RequestContext, input: CreateUnitInput): Promise<Unit> {
    return createUnit(ctx, input);
  }

  updateUnit(ctx: RequestContext, unitId: UnitId, input: UpdateUnitInput): Promise<Unit> {
    return updateUnit(ctx, unitId, input);
  }

  listUnits(ctx: RequestContext, svjId: SvjId): Promise<readonly Unit[]> {
    return listUnits(ctx, svjId);
  }

  getUnit(ctx: RequestContext, unitId: UnitId): Promise<Unit> {
    return getUnitById(ctx, unitId);
  }

  getShareOfUnit(ctx: RequestContext, unitId: UnitId): Promise<Share> {
    return getShareOfUnit(ctx, unitId);
  }

  createDepartment(ctx: RequestContext, input: CreateDepartmentInput): Promise<Department> {
    return createDepartment(ctx, input);
  }

  listDepartments(ctx: RequestContext): Promise<readonly Department[]> {
    return listDepartments(ctx);
  }
}
