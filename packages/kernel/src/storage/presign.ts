import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { RequestContext } from '../context/request-context';
import { loadEnv } from '../env/index';
import { bucketName, runOnStorage, s3 } from './client';
import { assertKeyInTenant, type StorageKey } from './keys';

/**
 * A short-lived link the browser can follow directly, so a download never streams through the API.
 * The signature carries no identity, which is why the lifetime is measured in minutes.
 */
export const presignedGetUrl = async (
  ctx: RequestContext,
  key: StorageKey,
  ttlSeconds?: number,
): Promise<string> => {
  assertKeyInTenant(ctx, key);
  const expiresIn = ttlSeconds ?? loadEnv().S3_PRESIGN_TTL_SECONDS;
  return runOnStorage('presign', key, () =>
    getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucketName(), Key: key }), { expiresIn }),
  );
};
