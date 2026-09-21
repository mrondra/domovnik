import type { z } from 'zod';
import type { conflictSchema, syncJobSchema } from '../domain/views';

type JobKind = z.output<typeof syncJobSchema>['kind'];
type JobStatus = z.output<typeof syncJobSchema>['status'];
type ConflictStatus = z.output<typeof conflictSchema>['status'];

export const JOB_KIND_LABEL: Readonly<Record<JobKind, string>> = {
  post_invoice: 'Zápis faktury',
  liquidate: 'Likvidace úhrady',
  import_statements: 'Načtení výpisu',
  import_receivables: 'Načtení pohledávek',
};

export const JOB_STATUS_LABEL: Readonly<Record<JobStatus, string>> = {
  pending: 'Čeká',
  running: 'Probíhá',
  done: 'Hotovo',
  failed: 'Selhalo',
};

export const CONFLICT_STATUS_LABEL: Readonly<Record<ConflictStatus, string>> = {
  open: 'Otevřený',
  resolved: 'Uzavřený',
};

/** The three fields the sweep compares, said the way an accountant says them (task 025). */
export const FIELD_LABEL: Readonly<Record<string, string>> = {
  amountTotal: 'Celková částka',
  dueOn: 'Splatnost',
  variableSymbol: 'Variabilní symbol',
  existence: 'Doklad v účetnictví',
};

const DATE_TIME = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' });

export const formatMoment = (value: string | null): string =>
  value === null ? 'Zatím nikdy' : DATE_TIME.format(new Date(value));

const isScalar = (value: unknown): value is string | number | boolean =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

/** Both sides of a disagreement are `unknown`: they are whatever the two systems had there. */
export const formatValue = (value: unknown): string => (isScalar(value) ? String(value) : '—');
