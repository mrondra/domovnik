import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ValidationError } from '../errors/index';
import { adminDatabaseUrl, inheritedEnv, loadEnv, logLevel, resetEnvCache } from './index';

const REQUIRED = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  APP_SECRET: 'a'.repeat(32),
  ANTHROPIC_API_KEY: 'key',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_ACCESS_KEY: 'a',
  S3_SECRET_KEY: 'b',
  S3_BUCKET: 'c',
};

const original = { ...process.env };

beforeEach(() => {
  for (const key of Object.keys(process.env)) Reflect.deleteProperty(process.env, key);
  Object.assign(process.env, REQUIRED);
  resetEnvCache();
});

afterEach(() => {
  for (const key of Object.keys(process.env)) Reflect.deleteProperty(process.env, key);
  Object.assign(process.env, original);
  resetEnvCache();
});

describe('loadEnv', () => {
  it('applies defaults for optional settings', () => {
    const env = loadEnv();
    expect(env.NODE_ENV).toBe('development');
    expect(env.LLM_MODE).toBe('live');
    expect(env.AGENT_MAX_CONCURRENCY).toBe(4);
  });

  it('names every missing or invalid variable', () => {
    delete process.env['APP_SECRET'];
    process.env['DATABASE_URL'] = 'not-a-url';
    resetEnvCache();

    const failure = (() => {
      try {
        loadEnv();
        return undefined;
      } catch (error: unknown) {
        return error;
      }
    })();

    expect(failure).toBeInstanceOf(ValidationError);
    expect((failure as ValidationError).message).toContain('APP_SECRET');
    expect((failure as ValidationError).message).toContain('DATABASE_URL');
  });

  it('rejects a secret that is too short to sign with', () => {
    process.env['APP_SECRET'] = 'short';
    resetEnvCache();
    expect(() => loadEnv()).toThrow(ValidationError);
  });

  it('falls back to the application connection for administrative access', () => {
    expect(adminDatabaseUrl(loadEnv())).toBe(REQUIRED.DATABASE_URL);
    process.env['DATABASE_ADMIN_URL'] = 'postgresql://owner@localhost:5432/db';
    resetEnvCache();
    expect(adminDatabaseUrl(loadEnv())).toBe('postgresql://owner@localhost:5432/db');
  });

  it('reads the log level before validation can run', () => {
    process.env['LOG_LEVEL'] = 'nonsense';
    expect(logLevel()).toBe('info');
    process.env['LOG_LEVEL'] = 'debug';
    expect(logLevel()).toBe('debug');
  });

  it('passes only defined variables to a spawned process', () => {
    process.env['EMPTY_ONE'] = undefined;
    expect(Object.values(inheritedEnv()).every((value) => typeof value === 'string')).toBe(true);
  });
});
