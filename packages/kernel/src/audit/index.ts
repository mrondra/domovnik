import { record } from './record';

export type { AuditEntry } from './record';

export const audit = { record } as const;
