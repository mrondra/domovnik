import { HttpException } from '@nestjs/common';
import { z } from 'zod';
import { isKernelError, toHttpStatus } from '../../../../packages/kernel/src/errors/index';

export interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Readonly<Record<string, unknown>>;
    readonly correlationId: string;
  };
}

export interface MappedError {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

/** Nest raises these for the framework's own refusals: an unknown route, a wrong method, a bad body. */
const CODE_BY_STATUS: Readonly<Record<number, string>> = {
  400: 'bad_request',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  405: 'method_not_allowed',
  409: 'conflict',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
};

const fromZod = (error: z.ZodError): MappedError => ({
  status: 400,
  code: 'validation_failed',
  message: 'Neplatný vstup',
  details: { issues: error.issues },
});

const fromKernel = (error: { code: string; message: string; details: Readonly<Record<string, unknown>> }) => {
  const base = { status: toHttpStatus(error), code: error.code, message: error.message };
  return Object.keys(error.details).length === 0 ? base : { ...base, details: error.details };
};

const fromHttpException = (error: HttpException): MappedError => {
  const status = error.getStatus();
  return { status, code: CODE_BY_STATUS[status] ?? 'http_error', message: error.message };
};

/**
 * Everything a client is allowed to see. An unexpected failure keeps its message to itself — the
 * correlation id is what connects the answer to the logged stack trace (docs/engineering.md §9).
 */
export const mapError = (error: unknown): MappedError => {
  if (error instanceof z.ZodError) return fromZod(error);
  if (isKernelError(error)) return fromKernel(error);
  if (error instanceof HttpException) return fromHttpException(error);
  return { status: 500, code: 'internal_error', message: 'Neočekávaná chyba' };
};

export const isUnexpected = (error: unknown): boolean =>
  !(error instanceof z.ZodError) && !isKernelError(error) && !(error instanceof HttpException);
