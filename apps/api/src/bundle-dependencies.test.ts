import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The production build bundles this app **and the kernel source it imports** into one CommonJS file
 * (see `tsup.config.ts`), while every bare specifier stays external. The kernel's runtime packages
 * are therefore this app's runtime packages, even though no file here imports them — which is also
 * why `knip.json` has to be told to leave them alone.
 */
const BUNDLED_FROM_KERNEL = ['@node-rs/argon2', 'drizzle-orm', 'pg', 'pg-boss', 'pino', 'uuid'] as const;

interface Manifest {
  readonly dependencies: Record<string, string>;
}

const manifest = async (relative: string): Promise<Manifest> =>
  JSON.parse(await readFile(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')) as Manifest;

describe('the runtime dependencies of the bundle', () => {
  it('declares every package the kernel needs at run time', async () => {
    const api = await manifest('../package.json');
    expect(Object.keys(api.dependencies)).toEqual(expect.arrayContaining([...BUNDLED_FROM_KERNEL]));
  });

  it('declares them at exactly the kernel version, so no second copy can appear', async () => {
    const [api, kernel] = await Promise.all([
      manifest('../package.json'),
      manifest('../../../packages/kernel/package.json'),
    ]);

    for (const name of BUNDLED_FROM_KERNEL) {
      expect([name, api.dependencies[name]]).toEqual([name, kernel.dependencies[name]]);
    }
  });
});
