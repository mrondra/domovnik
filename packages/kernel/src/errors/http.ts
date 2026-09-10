import {
  AdapterError,
  ConflictError,
  DomainError,
  ForbiddenError,
  KernelError,
  NotFoundError,
  ValidationError,
} from './taxonomy';

const STATUS_BY_ERROR = [
  { type: ValidationError, status: 400 },
  { type: ForbiddenError, status: 403 },
  { type: NotFoundError, status: 404 },
  { type: ConflictError, status: 409 },
  { type: DomainError, status: 422 },
  { type: AdapterError, status: 502 },
] as const;

const INTERNAL_ERROR = { code: 'internal_error', message: 'Neočekávaná chyba' } as const;

export const toHttpStatus = (error: unknown): number =>
  STATUS_BY_ERROR.find((entry) => error instanceof entry.type)?.status ?? 500;

/**
 * Shape handed to the model as a tool result. Stack traces and causes never cross this boundary:
 * they are operator information and would only pollute the agent context.
 */
export interface ToolErrorResult {
  readonly error: { readonly code: string; readonly message: string };
}

export const toToolErrorResult = (error: unknown): ToolErrorResult =>
  error instanceof KernelError
    ? { error: { code: error.code, message: error.message } }
    : { error: INTERNAL_ERROR };
