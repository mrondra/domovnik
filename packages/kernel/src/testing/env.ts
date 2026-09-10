import { resetEnvCache } from '../env/index';

const TEST_DEFAULTS: Readonly<Record<string, string>> = {
  NODE_ENV: 'test',
  // Placeholder for unit tests that never open a connection; `startTestDb` overwrites it.
  DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:5432/unused',
  LOG_LEVEL: 'silent',
  APP_SECRET: 'test-app-secret-must-be-at-least-32-chars',
  ANTHROPIC_API_KEY: 'test-anthropic-key',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_ACCESS_KEY: 'test',
  S3_SECRET_KEY: 'test',
  S3_BUCKET: 'test',
};

/** The one place outside `env/` that writes `process.env`; tests own their configuration. */
export const applyTestEnv = (overrides: Readonly<Record<string, string>> = {}): void => {
  for (const [key, value] of Object.entries(TEST_DEFAULTS)) {
    process.env[key] ??= value;
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }
  resetEnvCache();
};
