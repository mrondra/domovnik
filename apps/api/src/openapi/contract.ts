import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { z } from 'zod';

export interface EndpointContract {
  readonly summary: string;
  readonly response: z.ZodType;
  readonly status?: number;
}

/**
 * Describes what an endpoint answers. The request side needs nothing here: `@Body({ schema })` and
 * `@Query({ schema })` already carry their zod schema, and `@nestjs/swagger` reads it off the same
 * parameter metadata Nest validates with (see `http/validation.ts`).
 */
export const Endpoint = (contract: EndpointContract): MethodDecorator =>
  applyDecorators(
    ApiOperation({ summary: contract.summary }),
    ApiResponse({
      status: contract.status ?? 200,
      description: contract.summary,
      standardSchema: contract.response,
    }),
  );
