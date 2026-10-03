import { afterEach, describe, expect, it } from 'vitest';
import { createContext } from '../context/index';
import { AdapterError, NotFoundError } from '../errors/index';
import { newId, tenantIdSchema, userIdSchema } from '../ids/index';
import { getObject, putObject, storageKeyFor } from '../storage/index';
import { startTestStorage, type TestStorage } from './storage';

const started: TestStorage[] = [];

const start = async (): Promise<TestStorage> => {
  const storage = await startTestStorage();
  started.push(storage);
  return storage;
};

afterEach(async () => {
  await Promise.all(started.splice(0).map((storage) => storage.stop()));
});

const contextOf = () =>
  createContext({
    tenantId: newId(tenantIdSchema),
    actor: { type: 'user', id: newId(userIdSchema), roles: ['manager'] },
  });

describe('test storage harness', () => {
  it('gives every call its own bucket', async () => {
    const first = await start();
    const second = await start();

    expect(second.bucket).not.toBe(first.bucket);
  }, 180_000);

  it('does not show an object written under one call to the next one', async () => {
    const ctx = contextOf();
    const key = storageKeyFor(ctx, 'documents', 'izolace.txt');

    await start();
    await putObject(ctx, key, Buffer.from('prvni'), 'text/plain');
    await expect(getObject(ctx, key)).resolves.toMatchObject({ size: 5 });

    await start();
    await expect(getObject(ctx, key)).rejects.toBeInstanceOf(NotFoundError);
  }, 180_000);

  it('removes the bucket on stop, so reads fail as a storage error, not as a missing key', async () => {
    const ctx = contextOf();
    const key = storageKeyFor(ctx, 'documents', 'uklid.txt');
    const storage = await startTestStorage();
    await putObject(ctx, key, Buffer.from('data'), 'text/plain');

    await storage.stop();

    const failure = await getObject(ctx, key).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AdapterError);
    expect(failure).not.toBeInstanceOf(NotFoundError);
  }, 180_000);
});
