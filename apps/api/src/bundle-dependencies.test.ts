import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The production build bundles this app **and every relative import it reaches** into one CommonJS
 * file (see `tsup.config.ts`), while every bare specifier stays external. The packages the kernel
 * and the features need at run time are therefore this app's packages, even though no file here
 * imports them — which is also why `knip.json` has to be told to leave them alone.
 *
 * Getting this wrong does not fail the build: it fails `node dist/main.cjs` with
 * `Cannot find module`, which nothing but starting the application notices.
 */
const FROM_KERNEL = [
  '@anthropic-ai/sdk',
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  '@node-rs/argon2',
  'drizzle-orm',
  'langfuse',
  'pg',
  'pg-boss',
  'pino',
  'uuid',
] as const;

/**
 * Reached through a feature the API serves: `invoices` reads the text layer of a PDF, and
 * `accounting-sync` reads what Pohoda answered (task 025).
 */
const FROM_FEATURES: Readonly<Record<string, string>> = {
  'pdf-parse': '../../../packages/features/invoices/package.json',
  'fast-xml-parser': '../../../packages/features/accounting-sync/package.json',
};

interface Manifest {
  readonly dependencies: Record<string, string>;
}

const manifest = async (relative: string): Promise<Manifest> =>
  JSON.parse(await readFile(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')) as Manifest;

describe('the runtime dependencies of the bundle', () => {
  it('declares every package the kernel needs at run time', async () => {
    const api = await manifest('../package.json');

    expect(Object.keys(api.dependencies)).toEqual(expect.arrayContaining([...FROM_KERNEL]));
  });

  it('declares them at exactly the kernel version, so no second copy can appear', async () => {
    const [api, kernel] = await Promise.all([
      manifest('../package.json'),
      manifest('../../../packages/kernel/package.json'),
    ]);

    for (const name of FROM_KERNEL) {
      expect([name, api.dependencies[name]]).toEqual([name, kernel.dependencies[name]]);
    }
  });

  it('declares what the features it serves need, at the version those features use', async () => {
    const api = await manifest('../package.json');

    for (const [name, owner] of Object.entries(FROM_FEATURES)) {
      const feature = await manifest(owner);
      expect([name, api.dependencies[name]]).toEqual([name, feature.dependencies[name]]);
    }
  });
});
