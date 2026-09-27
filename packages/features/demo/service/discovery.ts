import { existsSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AdapterError } from '../../../kernel/src/errors/index';
import { loadSeedsFrom } from '../../../kernel/src/seed/index';

/**
 * `apps/api` bundles this file into `dist/main.cjs` (`apps/api/tsup.config.ts`); esbuild empties
 * `import.meta.url` for that CommonJS output, and `__dirname` there points at `dist`, not here — so
 * neither survives the bundle as a fix location for *this* file. Both survive as a *starting point*
 * for finding the repository root, though: walk up from wherever we are until `pnpm-workspace.yaml`
 * shows up, then the glob below stays `packages/features/<kind>/demo/<file>.ts` either way.
 */
const startDir = typeof __dirname === 'string' ? __dirname : dirname(fileURLToPath(import.meta.url));

const repoRootFrom = (dir: string): string => {
  if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
  const parent = dirname(dir);
  if (parent === dir) {
    throw new AdapterError(`pnpm-workspace.yaml not found above ${startDir}`, { retryable: false });
  }
  return repoRootFrom(parent);
};

const ROOT = repoRootFrom(startDir);
const DEMO_FILES = join(ROOT, 'packages/features/*/demo/*.ts');
const SEED_FILES = join(ROOT, 'packages/features/*/seed/*.seed.ts');

/** Plugin loading from a runtime registry: the glob finds the file, so the specifier is not known at author time. */
const importAll = async (pattern: string): Promise<void> => {
  for await (const entry of glob(pattern)) {
    await import(pathToFileURL(entry).href);
  }
};

/**
 * Importing a `demo/<kind>.ts` file registers a scenario kind or a reset the same way a tool file
 * registers itself on import (AGENTS.md §6); nothing here names a feature. The feature seeds are
 * imported too, but only for the `dependsOn` graph `resetDemo` reverses — nothing here ever calls
 * `seed.run`.
 *
 * Idempotent by Node's own module cache: calling this again after another `demo/*.ts` file has
 * appeared costs one glob and imports only what is new.
 */
export const loadDemoModules = (): Promise<void> =>
  Promise.all([importAll(DEMO_FILES), loadSeedsFrom([SEED_FILES])]).then(() => undefined);
