import { glob } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DomainError } from '../../../kernel/src/errors/index';
import { repoRoot } from '../paths';
import type { SeedModule } from './types';

const SEED_FILES = 'packages/features/*/seed/index.ts';

const isSeedModule = (value: unknown): value is SeedModule =>
  typeof value === 'object' &&
  value !== null &&
  'name' in value &&
  typeof value.name === 'string' &&
  'run' in value &&
  typeof value.run === 'function';

const exportedSeed = (loaded: unknown): unknown =>
  typeof loaded === 'object' && loaded !== null && 'seed' in loaded ? loaded.seed : undefined;

const seedOf = (loaded: unknown, entry: string): SeedModule => {
  const candidate = exportedSeed(loaded);
  if (!isSeedModule(candidate)) {
    throw new DomainError('Seed feature musí exportovat `seed` typu SeedModule', {
      code: 'seed_module_invalid',
      details: { entry },
    });
  }
  return candidate;
};

/** By convention, not by registration: a feature seeds itself the moment the directory exists. */
export const discoverSeedModules = async (): Promise<readonly SeedModule[]> => {
  const entries: string[] = [];
  for await (const entry of glob(SEED_FILES, { cwd: repoRoot() })) {
    entries.push(entry);
  }

  return Promise.all(
    entries
      .sort((left, right) => left.localeCompare(right))
      .map(async (entry) => {
        const loaded: unknown = await import(pathToFileURL(join(repoRoot(), entry)).href);
        return seedOf(loaded, entry);
      }),
  );
};
