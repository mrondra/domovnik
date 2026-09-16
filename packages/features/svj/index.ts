import { svjSummary } from './service/index';

export { SvjModule } from './api/svj.module';
export { SvjService } from './service/index';

export { svjCreated, unitUpdated } from './domain/events';
export type { Building, Department, Svj, SvjSummary, Unit, UnitKind } from './domain/types';
export type { Share } from './domain/share';

/** Read-only access for `reports` and `copilot`, which may not touch these tables (engineering §2). */
export const readModels = { svjSummary } as const;
