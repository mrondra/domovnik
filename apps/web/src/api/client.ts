import { cookies } from 'next/headers';
import { z } from 'zod';
import { AdapterError } from '../../../../packages/kernel/src/errors/index';
import { webEnv } from '../env';

const SVJ_HEADER = 'x-svj-id';

export interface ApiOptions {
  readonly method?: 'GET' | 'POST' | 'DELETE';
  readonly body?: unknown;
  readonly svjId?: string | undefined;
}

export interface ApiFailure {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
}

export type ApiResult<T> = { readonly ok: true; readonly data: T } | ApiFailure;

const errorSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

/** The browser's cookies are handed on unchanged, so the API sees the caller, not this server. */
const requestHeaders = async (options: ApiOptions): Promise<Record<string, string>> => {
  const jar = await cookies();
  const cookie = jar
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join('; ');

  return {
    ...(cookie === '' ? {} : { cookie }),
    ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
    ...(options.svjId === undefined ? {} : { [SVJ_HEADER]: options.svjId }),
  };
};

export const failureOf = (payload: unknown): ApiFailure => {
  const parsed = errorSchema.safeParse(payload);
  return parsed.success
    ? { ok: false, ...parsed.data.error }
    : { ok: false, code: 'api_unreadable', message: 'API odpovědělo v nečekaném tvaru.' };
};

export const parseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  return text === '' ? null : JSON.parse(text);
};

export const apiUrl = (path: string): string => `${webEnv().API_URL}${path}`;

/** Every call goes through here, so there is one place that knows how the API answers. */
export const callApi = async <S extends z.ZodType>(
  path: string,
  schema: S,
  options: ApiOptions = {},
): Promise<ApiResult<z.output<S>>> => {
  const response = await fetch(apiUrl(path), {
    method: options.method ?? 'GET',
    headers: await requestHeaders(options),
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    cache: 'no-store',
  });

  const payload = await parseBody(response);
  if (!response.ok) return failureOf(payload);
  return { ok: true, data: schema.parse(payload) };
};

/**
 * For a server component, where a failed read has no one to report to: the page is wrong either
 * way, so it fails loudly instead of rendering half of itself.
 */
export const readApi = async <S extends z.ZodType>(
  path: string,
  schema: S,
  options: ApiOptions = {},
): Promise<z.output<S>> => {
  const result = await callApi(path, schema, options);
  if (result.ok) return result.data;
  throw new AdapterError(result.message, { code: result.code, details: { path }, retryable: false });
};
