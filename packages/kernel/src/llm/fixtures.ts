import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { loadEnv } from '../env/index';
import { AdapterError } from '../errors/index';

const KEY_LENGTH = 32;

export const fixtureKey = (request: unknown): string =>
  createHash('sha256').update(JSON.stringify(request)).digest('hex').slice(0, KEY_LENGTH);

const fixturePath = (key: string): string => join(loadEnv().LLM_FIXTURE_DIR, `${key}.json`);

export const readFixture = async (key: string): Promise<unknown> => {
  const path = fixturePath(key);
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (cause) {
    throw new AdapterError(`Chybí LLM fixture ${path}`, {
      code: 'llm_fixture_missing',
      retryable: false,
      details: { key, path },
      cause,
    });
  }
};

export const writeFixture = async (key: string, response: unknown): Promise<void> => {
  const path = fixturePath(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(response, null, 2)}\n`);
};
