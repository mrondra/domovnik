import { NoSuchKey, S3ServiceException } from '@aws-sdk/client-s3';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdapterError, NotFoundError } from '../errors/index';
import { applyTestEnv } from '../testing/env';
import { bucketName, resetStorageClient, runOnStorage, s3 } from './client';
import { storageKeySchema } from './keys';

const KEY = storageKeySchema.parse('tenants/t/documents/a.pdf');

const serviceException = (httpStatusCode: number) =>
  new S3ServiceException({
    name: 'ServiceUnavailable',
    $fault: 'server',
    $metadata: { httpStatusCode },
  });

const failWith = (cause: Error) => runOnStorage('get', KEY, () => Promise.reject(cause));

beforeEach(() => {
  applyTestEnv();
  resetStorageClient();
});

describe('the S3 client', () => {
  it('is built once and points at the configured bucket', () => {
    expect(s3()).toBe(s3());
    expect(bucketName()).toBe('test');
  });

  it('is rebuilt after a reset, so a test can move the endpoint', () => {
    const first = s3();
    resetStorageClient();
    expect(s3()).not.toBe(first);
  });
});

describe('runOnStorage', () => {
  it('passes the answer through when the call succeeds', async () => {
    await expect(runOnStorage('get', KEY, () => Promise.resolve('ok'))).resolves.toBe('ok');
  });

  it('turns a missing key into a NotFoundError', async () => {
    await expect(failWith(new NoSuchKey({ message: 'missing', $metadata: {} }))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it.each([500, 503, 429, 0])('marks status %i as retryable', async (status) => {
    await expect(failWith(serviceException(status))).rejects.toMatchObject({ retryable: true });
  });

  it.each([403, 404])('marks status %i as final', async (status) => {
    await expect(failWith(serviceException(status))).rejects.toMatchObject({ retryable: false });
  });

  it('treats an exception without a status as retryable', async () => {
    const withoutStatus = new S3ServiceException({ name: 'X', $fault: 'server', $metadata: {} });
    await expect(failWith(withoutStatus)).rejects.toMatchObject({ retryable: true });
  });

  it('treats a transport failure as retryable and keeps the cause', async () => {
    const cause = new TypeError('fetch failed');
    const rejection = failWith(cause);
    await expect(rejection).rejects.toBeInstanceOf(AdapterError);
    await expect(rejection).rejects.toMatchObject({ retryable: true, cause });
  });
});
