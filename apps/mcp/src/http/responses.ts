import { isKernelError } from '../../../../packages/kernel/src/errors/index';

export const NOT_FOUND = 404;

const UNEXPECTED = { code: 'internal_error', message: 'Neočekávaná chyba' } as const;

const envelope = (code: string, message: string): string => JSON.stringify({ error: { code, message } });

/** The same `{ error: { code, message } }` envelope the REST API answers with (engineering.md §9). */
export const errorBody = (error: unknown): string =>
  isKernelError(error) ? envelope(error.code, error.message) : envelope(UNEXPECTED.code, UNEXPECTED.message);

export const notFoundBody = (): string => envelope('not_found', 'Neznámá cesta');

export const healthBody = (): string => JSON.stringify({ status: 'ok', database: 'ok' });
