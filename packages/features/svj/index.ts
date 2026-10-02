import './registry.generated';
import { svjSequence, svjSummary } from './service/index';

export { SvjModule } from './api/svj.module';
export { SvjService } from './service/index';
export { addDepartmentMember, departmentByCode, departmentsOf, membersOf } from './service/index';

export { svjCreated, unitUpdated } from './domain/events';
export type {
  Building,
  Department,
  DepartmentMembership,
  Svj,
  SvjSummary,
  Unit,
  UnitKind,
} from './domain/types';
export { departmentIdSchema, unitIdSchema } from './domain/ids';
export type { DepartmentId, UnitId } from './domain/ids';
export type { Share } from './domain/share';

/** Read-only access for features that may not touch these tables (engineering §2). */
export const readModels = { svjSummary, svjSequence } as const;
