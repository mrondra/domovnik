import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../../../../packages/kernel/src/logger/index';
import { isUnexpected, mapError, type ErrorBody } from './error-response';
import { stateOf } from './state';

/**
 * The single exit for every failure, so a client always reads the same envelope and an unexpected
 * failure is logged with the id it answered with (docs/engineering.md §9).
 */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const correlationId = stateOf(request.raw)?.correlationId ?? request.id;
    const mapped = mapError(error);

    if (isUnexpected(error)) {
      logger().error({ err: error, correlationId, path: request.url }, 'Nezachycená chyba requestu');
    }

    const body: ErrorBody = {
      error: {
        code: mapped.code,
        message: mapped.message,
        ...(mapped.details === undefined ? {} : { details: mapped.details }),
        correlationId,
      },
    };

    void http.getResponse<FastifyReply>().status(mapped.status).send(body);
  }
}
