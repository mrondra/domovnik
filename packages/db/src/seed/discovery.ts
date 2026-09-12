import { join } from 'node:path';
import { loadSeedsFrom, registeredSeeds, type SeedModule } from '../../../kernel/src/seed/index';
import { repoRoot } from '../paths';

const SEED_FILES = 'packages/features/*/seed/*.seed.ts';

/**
 * By convention, not by registration: importing the file is what calls `defineSeed`, so a feature
 * seeds itself the moment the file exists. The barrel next to it never declares anything.
 */
export const discoverSeedModules = async (): Promise<readonly SeedModule[]> => {
  await loadSeedsFrom([join(repoRoot(), SEED_FILES)]);
  return registeredSeeds();
};
