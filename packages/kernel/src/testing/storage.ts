import { randomBytes } from 'node:crypto';
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { AdapterError } from '../errors/index';
import { resetStorageClient } from '../storage/index';
import { applyTestEnv } from './env';

/**
 * Chainguard, because MinIO's own images are gone: `docker pull minio/minio` answers „repository
 * does not exist" and quay.io answers 401 — for every tag, and for the digest of the tag this file
 * used to pin. A machine with the old image cached does not notice; CI, which has no cache, cannot
 * start a single test. That is how it broke.
 *
 * The tag is `latest` and that is deliberate, though it argues against the rule of pinning: the
 * free tier publishes nothing else, and an old digest is garbage-collected within weeks, so a pin
 * would rot faster than the tag moves. What we buy for it is an image someone still patches.
 */
const IMAGE = 'cgr.dev/chainguard/minio:latest';
const PORT = 9000;
const ROOT_USER = 'domovnik';
const ROOT_PASSWORD = 'domovnik123';
const BUCKET_PREFIX = 'domovnik-test';

interface Provided {
  readonly endpoint: string;
  readonly accessKey: string;
  readonly secretKey: string;
}

export interface TestStorage {
  readonly endpoint: string;
  readonly bucket: string;
  stop(): Promise<void>;
}

/**
 * What the process was started with, read once when this module loads. `applyTestEnv` fills in
 * placeholders (`S3_ENDPOINT=http://localhost:9000`, `test`/`test`) through `??=` before any test
 * reaches `startTestStorage`, and this function itself writes the container's endpoint into the
 * environment — so a read at call time could not tell a MinIO somebody started from a leftover.
 * Imports run before test bodies, which makes this the one moment the environment is still the
 * caller's own.
 */
const readProvided = (): Provided | undefined => {
  const { S3_ENDPOINT: endpoint, S3_ACCESS_KEY: accessKey, S3_SECRET_KEY: secretKey } = process.env;
  if (endpoint === undefined || accessKey === undefined || secretKey === undefined) return undefined;
  return { endpoint, accessKey, secretKey };
};
const PROVIDED = readProvided();

/** Emptied and dropped on `stop()`; only ever a bucket this harness made, never the one from the environment. */
const dropBucket = async (admin: S3Client, bucket: string): Promise<void> => {
  let token: string | undefined;
  do {
    const page = await admin.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    const keys = (page.Contents ?? []).flatMap(({ Key }) => (Key === undefined ? [] : [{ Key }]));
    if (keys.length > 0) await admin.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys } }));
    token = page.NextContinuationToken;
  } while (token !== undefined);
  await admin.send(new DeleteBucketCommand({ Bucket: bucket }));
};

/**
 * A bucket of its own per call, in a MinIO either already running (`S3_ENDPOINT`, `S3_ACCESS_KEY`
 * and `S3_SECRET_KEY` in the environment of the process — docker compose locally) or started here
 * by testcontainers. It writes the `S3_*` variables into the environment and drops the memoised
 * client, so `putObject` and friends talk to this bucket.
 *
 * Test files share a running MinIO, and so do worktrees on one machine, hence the random suffix.
 * `stop()` empties and deletes the bucket in a reused MinIO and stops the container otherwise.
 */
export const startTestStorage = async (): Promise<TestStorage> => {
  const bucket = `${BUCKET_PREFIX}-${randomBytes(6).toString('hex')}`;
  let provided = PROVIDED;
  let container: StartedTestContainer | undefined;
  if (provided === undefined) {
    container = await new GenericContainer(IMAGE)
      .withEnvironment({ MINIO_ROOT_USER: ROOT_USER, MINIO_ROOT_PASSWORD: ROOT_PASSWORD })
      .withCommand(['server', '/data'])
      .withExposedPorts(PORT)
      .withWaitStrategy(Wait.forHttp('/minio/health/live', PORT))
      .start();
    const endpoint = `http://${container.getHost()}:${String(container.getMappedPort(PORT))}`;
    provided = { endpoint, accessKey: ROOT_USER, secretKey: ROOT_PASSWORD };
  }

  const admin = new S3Client({
    endpoint: provided.endpoint,
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId: provided.accessKey, secretAccessKey: provided.secretKey },
  });
  try {
    await admin.send(new CreateBucketCommand({ Bucket: bucket }));
  } catch (cause) {
    admin.destroy();
    await container?.stop();
    throw new AdapterError(`Bucket ${bucket} se nepodařilo vytvořit`, {
      code: 'test_bucket_failed',
      retryable: false,
      details: { endpoint: provided.endpoint },
      cause,
    });
  }

  applyTestEnv({
    S3_ENDPOINT: provided.endpoint,
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY: provided.accessKey,
    S3_SECRET_KEY: provided.secretKey,
    S3_BUCKET: bucket,
  });
  resetStorageClient();

  return {
    endpoint: provided.endpoint,
    bucket,
    stop: async () => {
      resetStorageClient();
      try {
        if (container === undefined) await dropBucket(admin, bucket);
        else await container.stop();
      } finally {
        admin.destroy();
      }
    },
  };
};
