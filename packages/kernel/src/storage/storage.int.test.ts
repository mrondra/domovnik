import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createContext } from '../context/index';
import { ForbiddenError, NotFoundError } from '../errors/index';
import { newId, tenantIdSchema, userIdSchema } from '../ids/index';
import { startTestStorage, type TestStorage } from '../testing/index';
import { storageKeyFor } from './keys';
import { deleteObject, getObject, putObject } from './operations';
import { presignedGetUrl } from './presign';

let storage: TestStorage;

beforeAll(async () => {
  storage = await startTestStorage();
}, 180_000);

afterAll(async () => {
  await storage.stop();
});

const contextOf = () =>
  createContext({
    tenantId: newId(tenantIdSchema),
    actor: { type: 'user', id: newId(userIdSchema), roles: ['manager'] },
  });

const CONTENT = 'Faktura č. 2024/001';

describe('object storage', () => {
  it('reads back what it stored, with the content type it was given', async () => {
    const ctx = contextOf();
    const key = storageKeyFor(ctx, 'documents', 'faktura.txt');

    const stored = await putObject(ctx, key, Buffer.from(CONTENT), 'text/plain');
    expect(stored.size).toBe(Buffer.byteLength(CONTENT));
    expect(stored.sha256).toBe(createHash('sha256').update(CONTENT).digest('hex'));

    const found = await getObject(ctx, key);
    expect(found.contentType).toBe('text/plain');
    expect(found.size).toBe(stored.size);
    await expect(text(found.body)).resolves.toBe(CONTENT);
  });

  it('accepts a stream and hashes what went through it', async () => {
    const ctx = contextOf();
    const key = storageKeyFor(ctx, 'documents', 'stream.txt');

    const stored = await putObject(ctx, key, Readable.from([CONTENT]), 'text/plain');
    expect(stored.sha256).toBe(createHash('sha256').update(CONTENT).digest('hex'));
    await expect(getObject(ctx, key).then((found) => text(found.body))).resolves.toBe(CONTENT);
  });

  it('serves the object over a presigned link without a credential', async () => {
    const ctx = contextOf();
    const key = storageKeyFor(ctx, 'documents', 'odkaz.txt');
    await putObject(ctx, key, Buffer.from(CONTENT), 'text/plain');

    const response = await fetch(await presignedGetUrl(ctx, key));
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe(CONTENT);
  });

  it('reports a deleted object as missing', async () => {
    const ctx = contextOf();
    const key = storageKeyFor(ctx, 'documents', 'smazana.txt');
    await putObject(ctx, key, Buffer.from(CONTENT), 'text/plain');

    await deleteObject(ctx, key);
    await expect(getObject(ctx, key)).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteObject(ctx, key)).resolves.toBeUndefined();
  });

  it('refuses every operation on a key of another tenant', async () => {
    const owner = contextOf();
    const key = storageKeyFor(owner, 'documents', 'cizi.txt');
    await putObject(owner, key, Buffer.from(CONTENT), 'text/plain');

    const intruder = contextOf();
    await expect(getObject(intruder, key)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(putObject(intruder, key, Buffer.from('x'), 'text/plain')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(deleteObject(intruder, key)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(presignedGetUrl(intruder, key)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
