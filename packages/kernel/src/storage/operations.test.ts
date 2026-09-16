import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createContext } from '../context/index';
import { AdapterError } from '../errors/index';
import { newId, tenantIdSchema, userIdSchema } from '../ids/index';
import { applyTestEnv } from '../testing/env';
import { resetStorageClient, s3 } from './client';
import { storageKeyFor } from './keys';
import { getObject } from './operations';

const ctx = () =>
  createContext({
    tenantId: newId(tenantIdSchema),
    actor: { type: 'user', id: newId(userIdSchema), roles: ['manager'] },
  });

/** The answer S3 gives back, with the fields the SDK marks optional left out on purpose. */
const answerWith = (response: unknown) => {
  vi.spyOn(s3(), 'send').mockResolvedValue(response as never);
};

beforeEach(() => {
  applyTestEnv();
  resetStorageClient();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getObject', () => {
  it('falls back to a binary content type and an unknown size', async () => {
    answerWith({ Body: Readable.from(['obsah']) });

    const context = ctx();
    const found = await getObject(context, storageKeyFor(context, 'documents', 'a.bin'));
    expect(found.contentType).toBe('application/octet-stream');
    expect(found.size).toBe(0);
    await expect(text(found.body)).resolves.toBe('obsah');
  });

  it('refuses an answer that carries no readable body', async () => {
    answerWith({ ContentType: 'text/plain' });

    const context = ctx();
    await expect(getObject(context, storageKeyFor(context, 'documents', 'a.txt'))).rejects.toBeInstanceOf(
      AdapterError,
    );
  });
});
