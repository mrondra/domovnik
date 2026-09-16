import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { buffer as readToEnd } from 'node:stream/consumers';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { RequestContext } from '../context/request-context';
import { AdapterError } from '../errors/taxonomy';
import { bucketName, runOnStorage, s3 } from './client';
import { assertKeyInTenant, type StorageKey } from './keys';

export interface StoredObject {
  readonly key: StorageKey;
  readonly size: number;
  readonly sha256: string;
}

export interface ObjectContent {
  readonly body: Readable;
  readonly contentType: string;
  readonly size: number;
}

const FALLBACK_CONTENT_TYPE = 'application/octet-stream';

/** S3 wants the length before the first byte goes out, so a stream is read in full up front. */
const toBuffer = async (body: Buffer | Readable): Promise<Buffer> =>
  Buffer.isBuffer(body) ? body : readToEnd(body);

export const putObject = async (
  ctx: RequestContext,
  key: StorageKey,
  body: Buffer | Readable,
  contentType: string,
): Promise<StoredObject> => {
  assertKeyInTenant(ctx, key);
  const bytes = await toBuffer(body);
  const sha256 = createHash('sha256').update(bytes).digest('hex');

  await runOnStorage('put', key, () =>
    s3().send(
      new PutObjectCommand({ Bucket: bucketName(), Key: key, Body: bytes, ContentType: contentType }),
    ),
  );

  return { key, size: bytes.byteLength, sha256 };
};

export const getObject = async (ctx: RequestContext, key: StorageKey): Promise<ObjectContent> => {
  assertKeyInTenant(ctx, key);
  const response = await runOnStorage('get', key, () =>
    s3().send(new GetObjectCommand({ Bucket: bucketName(), Key: key })),
  );

  if (!(response.Body instanceof Readable)) {
    throw new AdapterError('Úložiště vrátilo objekt bez těla', {
      code: 'storage_empty_body',
      retryable: true,
      details: { key },
    });
  }

  return {
    body: response.Body,
    contentType: response.ContentType ?? FALLBACK_CONTENT_TYPE,
    size: response.ContentLength ?? 0,
  };
};

/** S3 delete is idempotent: a key that is already gone is a success, not a `NotFoundError`. */
export const deleteObject = async (ctx: RequestContext, key: StorageKey): Promise<void> => {
  assertKeyInTenant(ctx, key);
  await runOnStorage('delete', key, () =>
    s3().send(new DeleteObjectCommand({ Bucket: bucketName(), Key: key })),
  );
};
