import { glob } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadSeedsFrom } from '../../../kernel/src/seed/index';

const DEMO_FILES = new URL('../../*/demo/*.ts', import.meta.url).pathname;
const SEED_FILES = new URL('../../*/seed/*.seed.ts', import.meta.url).pathname;

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
