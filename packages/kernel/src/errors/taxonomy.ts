export interface KernelErrorOptions {
  readonly code?: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly cause?: unknown;
}

export abstract class KernelError extends Error {
  readonly code: string;
  readonly details: Readonly<Record<string, unknown>>;

  protected constructor(defaultCode: string, message: string, options: KernelErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code ?? defaultCode;
    this.details = options.details ?? {};
  }
}

/** A business rule was violated. */
export class DomainError extends KernelError {
  constructor(message: string, options: KernelErrorOptions = {}) {
    super('domain_error', message, options);
  }
}

export class NotFoundError extends KernelError {
  constructor(message: string, options: KernelErrorOptions = {}) {
    super('not_found', message, options);
  }
}

/** No usable credential was presented; `ForbiddenError` is for a known actor who may not. */
export class UnauthenticatedError extends KernelError {
  constructor(message: string, options: KernelErrorOptions = {}) {
    super('unauthenticated', message, options);
  }
}

export class ForbiddenError extends KernelError {
  constructor(message: string, options: KernelErrorOptions = {}) {
    super('forbidden', message, options);
  }
}

/** Input rejected at a boundary, typically by zod. */
export class ValidationError extends KernelError {
  constructor(message: string, options: KernelErrorOptions = {}) {
    super('validation_failed', message, options);
  }
}

/** The sync target and our copy disagree. */
export class ConflictError extends KernelError {
  constructor(message: string, options: KernelErrorOptions = {}) {
    super('conflict', message, options);
  }
}

export class AdapterError extends KernelError {
  readonly retryable: boolean;

  constructor(message: string, options: KernelErrorOptions & { readonly retryable: boolean }) {
    super('adapter_failed', message, options);
    this.retryable = options.retryable;
  }
}

export const isKernelError = (error: unknown): error is KernelError => error instanceof KernelError;

export const isRetryable = (error: unknown): boolean => error instanceof AdapterError && error.retryable;
