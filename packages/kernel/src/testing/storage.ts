import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { AdapterError } from '../errors/index';
import { resetStorageClient } from '../storage/index';
import { applyTestEnv } from './env';

/**
 * From quay.io, not from Docker Hub: MinIO stopped publishing there, so `minio/minio` now answers
 * a pull with „access denied" — on a machine with the old image cached the tests kept passing and
 * CI, which has no cache, could not start a single one of them. The tag is pinned for the same
 * reason `docker-compose.yml` pins it: a test that depends on what `latest` means today is a test
 * that breaks on a Tuesday.
 */
const IMAGE = 'quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z';
const PORT = 9000;
const ROOT_USER = 'domovnik';
const ROOT_PASSWORD = 'domovnik123';
const BUCKET = 'domovnik-test';

export interface TestStorage {
  readonly endpoint: string;
  readonly bucket: string;
  stop(): Promise<void>;
}

/** `mc` ships inside the MinIO image; compose creates its bucket the same way. */
const createBucket = async (container: StartedTestContainer): Promise<void> => {
  const script = [
    `mc alias set local http://localhost:${String(PORT)} ${ROOT_USER} ${ROOT_PASSWORD}`,
    `mc mb --ignore-existing local/${BUCKET}`,
  ].join(' && ');
  const result = await container.exec(['sh', '-c', script]);
  if (result.exitCode !== 0) {
    throw new AdapterError(`Bucket ${BUCKET} se nepodařilo vytvořit`, {
      code: 'test_bucket_failed',
      retryable: false,
      details: { output: result.output },
    });
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

  await createBucket(container);

  const endpoint = `http://${container.getHost()}:${String(container.getMappedPort(PORT))}`;
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
