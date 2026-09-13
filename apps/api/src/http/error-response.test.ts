import { NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import {
  AdapterError,
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../../../packages/kernel/src/errors/index';
import { isUnexpected, mapError } from './error-response';

describe('mapError', () => {
  it('maps the kernel taxonomy onto HTTP', () => {
    expect(mapError(new ValidationError('x')).status).toBe(400);
    expect(mapError(new UnauthenticatedError('x')).status).toBe(401);
    expect(mapError(new ForbiddenError('x')).status).toBe(403);
    expect(mapError(new NotFoundError('x')).status).toBe(404);
    expect(mapError(new ConflictError('x')).status).toBe(409);
    expect(mapError(new DomainError('x')).status).toBe(422);
    expect(mapError(new AdapterError('x', { retryable: true })).status).toBe(502);
  });

  it('carries the code and the details a caller can act on', () => {
    const mapped = mapError(new DomainError('Duplicitní faktura', { code: 'invoice_duplicate' }));
    expect(mapped).toMatchObject({ code: 'invoice_duplicate', message: 'Duplicitní faktura' });
    expect(mapped.details).toBeUndefined();

    expect(mapError(new NotFoundError('x', { details: { id: '1' } })).details).toEqual({ id: '1' });
  });

  it('turns a zod failure into a 400 that names the fields', () => {
    const parsed = z.object({ email: z.email() }).safeParse({ email: 'nonsense' });
    expect(parsed.success).toBe(false);
    const mapped = mapError(parsed.error);

    expect(mapped.status).toBe(400);
    expect(mapped.code).toBe('validation_failed');
    expect(mapped.details?.['issues']).toHaveLength(1);
  });

  it("gives Nest's own refusals the same vocabulary", () => {
    expect(mapError(new NotFoundException('Cannot GET /nope'))).toMatchObject({
      status: 404,
      code: 'not_found',
    });
  });

  it('tells a client nothing about an unexpected failure', () => {
    const mapped = mapError(new TypeError('config.users is not a function'));

    expect(mapped).toEqual({ status: 500, code: 'internal_error', message: 'Neočekávaná chyba' });
    expect(isUnexpected(new TypeError('x'))).toBe(true);
    expect(isUnexpected(new DomainError('x'))).toBe(false);
  });
});
