import { describe, expect, it } from 'vitest';
import {
  AdapterError,
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  isKernelError,
  isRetryable,
} from './index';
import { toHttpStatus, toToolErrorResult } from './http';

describe('error taxonomy', () => {
  it('carries a default code, details and cause', () => {
    const cause = new DomainError('původ');
    const error = new NotFoundError('Faktura nenalezena', { details: { id: '1' }, cause });

    expect(error.code).toBe('not_found');
    expect(error.details).toEqual({ id: '1' });
    expect(error.cause).toBe(cause);
    expect(error.name).toBe('NotFoundError');
    expect(isKernelError(error)).toBe(true);
  });

  it('lets a domain rule name its own code', () => {
    expect(new DomainError('duplicita', { code: 'invoice_duplicate' }).code).toBe('invoice_duplicate');
  });

  it('marks only retryable adapter failures as retryable', () => {
    expect(isRetryable(new AdapterError('mServer', { retryable: true }))).toBe(true);
    expect(isRetryable(new AdapterError('mServer', { retryable: false }))).toBe(false);
    expect(isRetryable(new ConflictError('rozejito'))).toBe(false);
  });
});

describe('error mapping', () => {
  it('maps each kind to its HTTP status', () => {
    expect(toHttpStatus(new ValidationError('x'))).toBe(400);
    expect(toHttpStatus(new ForbiddenError('x'))).toBe(403);
    expect(toHttpStatus(new NotFoundError('x'))).toBe(404);
    expect(toHttpStatus(new ConflictError('x'))).toBe(409);
    expect(toHttpStatus(new DomainError('x'))).toBe(422);
    expect(toHttpStatus(new AdapterError('x', { retryable: true }))).toBe(502);
    expect(toHttpStatus(new TypeError('x'))).toBe(500);
  });

  it('hides everything but code and message from the model', () => {
    const result = toToolErrorResult(new ForbiddenError('Nesmíš', { details: { secret: 'x' } }));
    expect(result).toEqual({ error: { code: 'forbidden', message: 'Nesmíš' } });
  });

  it('does not leak an unexpected failure to the model', () => {
    expect(toToolErrorResult(new TypeError('undefined is not a function'))).toEqual({
      error: { code: 'internal_error', message: 'Neočekávaná chyba' },
    });
  });
});
