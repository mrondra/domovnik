import { DomainError } from '../../../kernel/src/errors/index';
import type { SeedModule } from '../../../kernel/src/seed/index';

type Visit = 'visiting' | 'done';

const unknownDependency = (module: string, dependency: string): DomainError =>
  new DomainError('Seed závisí na feature, která seed nemá', {
    code: 'seed_dependency_missing',
    details: { module, dependency },
  });

/** Declared dependencies decide the order; a cycle is a configuration error, not something to retry. */
export const orderSeedModules = (modules: readonly SeedModule[]): readonly SeedModule[] => {
  const byName = new Map(modules.map((module) => [module.name, module]));
  const state = new Map<string, Visit>();
  const ordered: SeedModule[] = [];

  const visit = (module: SeedModule, trail: readonly string[]): void => {
    const seen = state.get(module.name);
    if (seen === 'done') return;
    if (seen === 'visiting') {
      throw new DomainError('Cyklická závislost mezi seedy', {
        code: 'seed_dependency_cycle',
        details: { cycle: [...trail, module.name] },
      });
    }

    state.set(module.name, 'visiting');
    for (const name of module.dependsOn ?? []) {
      const dependency = byName.get(name);
      if (dependency === undefined) throw unknownDependency(module.name, name);
      visit(dependency, [...trail, module.name]);
    }
    state.set(module.name, 'done');
    ordered.push(module);
  };

  for (const module of [...modules].sort((left, right) => left.name.localeCompare(right.name))) {
    visit(module, []);
  }
  return ordered;
};
