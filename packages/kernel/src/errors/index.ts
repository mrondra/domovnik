export {
  AdapterError,
  ConflictError,
  DomainError,
  ForbiddenError,
  KernelError,
  NotFoundError,
  ValidationError,
  isKernelError,
  isRetryable,
} from './taxonomy';
export type { KernelErrorOptions } from './taxonomy';
export { toHttpStatus, toToolErrorResult } from './http';
export type { ToolErrorResult } from './http';
