import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ValidationError } from '../../../../packages/kernel/src/errors/index';

/**
 * Nest 12 validates a parameter against the Standard Schema attached to it, and zod 4 is a Standard
 * Schema. One schema object therefore both validates the request and describes it in OpenAPI — the
 * two cannot drift, and there is no DTO class in between.
 *
 * The only thing worth replacing is the error: Nest would raise its own `BadRequestException`, and
 * every failure in this API goes out through the kernel taxonomy (docs/engineering.md §9).
 */
export const validationPipe = (): StandardSchemaValidationPipe =>
  new StandardSchemaValidationPipe({
    exceptionFactory: (issues) =>
      new ValidationError('Neplatný vstup', { code: 'request_invalid', details: { issues } }),
  });
