import { NoSuchKey, S3Client, S3ServiceException } from '@aws-sdk/client-s3';
import { loadEnv } from '../env/index';
import { AdapterError, NotFoundError } from '../errors/taxonomy';
import type { StorageKey } from './keys';

const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;

let client: S3Client | undefined;

/**
 * The only S3 client in the codebase. `forcePathStyle` because MinIO serves the bucket as a path
 * segment; virtual-host addressing would need a DNS name per bucket.
 */
export const s3 = (): S3Client => {
  const env = loadEnv();
  client ??= new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      // gitleaks:allow — the name of an environment variable, never the value of one.
      secretAccessKey: env.S3_SECRET_KEY,
    },
  });
  return client;
};

/** The single bucket; tenants are kept apart by the key prefix, not by a bucket each. */
export const bucketName = (): string => loadEnv().S3_BUCKET;

/** A test points the client at its own container, so the memoised one has to go. */
export const resetStorageClient = (): void => {
  client = undefined;
};

/** A transport failure carries no HTTP status; retrying it is the whole point of the taxonomy. */
const isRetryable = (cause: unknown): boolean => {
  if (!(cause instanceof S3ServiceException)) return true;
  const status = cause.$metadata.httpStatusCode ?? 0;
  return status === 0 || status === TOO_MANY_REQUESTS || status >= SERVER_ERROR;
};

/** Every call to S3 goes through here, so no raw SDK exception escapes the module. */
export const runOnStorage = async <T>(
  operation: string,
  key: StorageKey,
  call: () => Promise<T>,
): Promise<T> => {
  try {
    return await call();
  } catch (cause) {
    if (cause instanceof NoSuchKey) {
      throw new NotFoundError('Objekt v úložišti neexistuje', {
        code: 'storage_object_not_found',
        details: { key },
        cause,
      });
    }
    throw new AdapterError(`Úložiště selhalo při operaci ${operation}`, {
      code: 'storage_failed',
      retryable: isRetryable(cause),
      details: { key, operation },
      cause,
    });
  }
};
