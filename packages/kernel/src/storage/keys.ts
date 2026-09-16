import { z } from 'zod';
import { v7 as uuidv7 } from 'uuid';
import type { RequestContext } from '../context/request-context';
import { ForbiddenError, ValidationError } from '../errors/taxonomy';

/** `tenants/<tenantId>/<area>/<uuid>[.ext]` — the tenant prefix is what keeps tenants apart. */
export const storageKeySchema = z.string().min(1).brand<'StorageKey'>();
export type StorageKey = z.infer<typeof storageKeySchema>;

const AREA = /^[a-z][a-z0-9-]*$/;
const EXTENSION = /\.[a-z0-9]{1,10}$/i;

const reject = (message: string, details: Readonly<Record<string, unknown>>): never => {
  throw new ValidationError(message, { code: 'storage_key_invalid', details });
};

const extensionOf = (filename: string): string => EXTENSION.exec(filename)?.[0].toLowerCase() ?? '';

export const tenantPrefix = (ctx: RequestContext): string => `tenants/${ctx.tenantId}/`;

/**
 * The stored name is a fresh uuid v7, never the uploaded one: the original carries the user's
 * words, is not unique, and would let a caller write across the prefix it was given.
 */
export const storageKeyFor = (ctx: RequestContext, area: string, filename: string): StorageKey => {
  if (!AREA.test(area)) reject('Oblast úložiště musí být název feature', { area });
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    reject('Název souboru nesmí obsahovat cestu', { filename });
  }
  return storageKeySchema.parse(`${tenantPrefix(ctx)}${area}/${uuidv7()}${extensionOf(filename)}`);
};

/** Every operation asks first; a key from a request body is otherwise a read of another tenant. */
export const assertKeyInTenant = (ctx: RequestContext, key: StorageKey): void => {
  if (key.startsWith(tenantPrefix(ctx))) return;
  throw new ForbiddenError('Klíč v úložišti patří jinému tenantovi', {
    code: 'storage_key_outside_tenant',
    details: { key, tenantId: ctx.tenantId },
  });
};
