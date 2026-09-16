import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GeneratorError } from './cli';

interface PackageManifest {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

/**
 * Nest arrives with the API layer; the feature declares it because it owns the module, the service
 * and its controllers. `@nestjs/swagger` is there because a feature describes its own endpoints —
 * the `Endpoint` helper lives in `apps/api` and a feature may not import from an app (ADR 0002).
 */
const NEST = {
  '@nestjs/common': '^12.0.1',
  '@nestjs/swagger': '^12.0.1',
  'reflect-metadata': '^0.2.2',
  rxjs: '^7.8.2',
};

/**
 * A feature's `ui/` is app-router UI — the `*.client.tsx` convention in `tooling/eslint` says so —
 * so it links with `next/link` and needs Next on top of React to type check.
 */
const REACT = { next: '^15.5.25', react: '^19.3.0' };
const REACT_TYPES = { '@types/react': '^19.3.0' };

export interface FeatureDependencies {
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
}

const pick = (source: Readonly<Record<string, string>> | undefined, name: string): string => {
  const version = source?.[name];
  if (version === undefined) {
    throw new GeneratorError(`packages/kernel/package.json neuvádí ${name}, nevím jakou verzi vygenerovat.`);
  }
  return version;
};

/** Shared runtime versions are read from the kernel so a generated feature cannot drift from it. */
export const featureDependencies = async (root: string): Promise<FeatureDependencies> => {
  const kernel = JSON.parse(
    await readFile(join(root, 'packages/kernel/package.json'), 'utf8'),
  ) as PackageManifest;

  return {
    dependencies: {
      ...NEST,
      ...REACT,
      'drizzle-orm': pick(kernel.dependencies, 'drizzle-orm'),
      zod: pick(kernel.dependencies, 'zod'),
    },
    devDependencies: { ...REACT_TYPES, vitest: pick(kernel.devDependencies, 'vitest') },
  };
};
