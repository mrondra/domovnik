import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { GenericContainer, Wait } from 'testcontainers';
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
const BUCKET = 'domovnik-test';

export interface TestStorage {
  readonly endpoint: string;
  readonly bucket: string;
  stop(): Promise<void>;
}

/**
 * Over the S3 API, not with `mc` inside the container: the image is distroless in places and what
 * ships in it is not ours to depend on. The bucket is made with the same protocol the tests use,
 * so if this call works the tests can talk to the container at all.
 */
const createBucket = async (endpoint: string): Promise<void> => {
  const admin = new S3Client({
    endpoint,
    region: 'us-east-1',
    forcePathStyle: true,
    // gitleaks:allow — fixed credentials of a throwaway container, never a real secret.
    credentials: { accessKeyId: ROOT_USER, secretAccessKey: ROOT_PASSWORD },
  });
  try {
    await admin.send(new CreateBucketCommand({ Bucket: BUCKET }));
  } catch (cause) {
    throw new AdapterError(`Bucket ${BUCKET} se nepodařilo vytvořit`, {
      code: 'test_bucket_failed',
      retryable: false,
      details: { endpoint },
      cause,
    });
  } finally {
    admin.destroy();
  }
};

/**
 * A MinIO per test file, with the bucket already there. It writes the `S3_*` variables into the
 * environment and drops the memoised client, so `putObject` and friends talk to this container.
 */
export const startTestStorage = async (): Promise<TestStorage> => {
  const container = await new GenericContainer(IMAGE)
    .withEnvironment({ MINIO_ROOT_USER: ROOT_USER, MINIO_ROOT_PASSWORD: ROOT_PASSWORD })
    .withCommand(['server', '/data'])
    .withExposedPorts(PORT)
    .withWaitStrategy(Wait.forHttp('/minio/health/live', PORT))
    .start();

  const endpoint = `http://${container.getHost()}:${String(container.getMappedPort(PORT))}`;
  await createBucket(endpoint);

  applyTestEnv({
    S3_ENDPOINT: endpoint,
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY: ROOT_USER,
    S3_SECRET_KEY: ROOT_PASSWORD,
    S3_BUCKET: BUCKET,
  });
  resetStorageClient();

  return {
    endpoint,
    bucket: BUCKET,
    stop: async () => {
      resetStorageClient();
      await container.stop();
    },
  };
};
