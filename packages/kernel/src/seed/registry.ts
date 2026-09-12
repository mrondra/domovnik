import type { SeedModule } from './types';

const registry = new Map<string, SeedModule>();

/** Registration is a side effect of declaring the seed — same as `defineAgent` and `defineTool`. */
export const defineSeed = (module: SeedModule): SeedModule => {
  registry.set(module.name, module);
  return module;
};

export const clearSeeds = (): void => {
  registry.clear();
};

export const registeredSeeds = (): readonly SeedModule[] => [...registry.values()];
