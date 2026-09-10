import type { GeneratedFile } from '../lib/files';
import type { Names } from '../lib/names';
import { featurePath } from '../lib/repo';
import type { FeatureDependencies } from '../lib/versions';
import { packageJson, readme, tsconfigJson } from './feature-meta';
import { moduleTs, serviceTs } from './feature-service';
import { domainEvents, domainTypes, indexTs, schemaTs } from './feature-source';
import { rlsIntTest } from './feature-test';

export const featureFiles = (names: Names, dependencies: FeatureDependencies): readonly GeneratedFile[] => {
  const at = (relative: string): string => `${featurePath(names.kebab)}/${relative}`;

  return [
    { path: at('package.json'), contents: packageJson(names, dependencies) },
    { path: at('tsconfig.json'), contents: tsconfigJson() },
    { path: at('README.md'), contents: readme(names) },
    { path: at('index.ts'), contents: indexTs(names) },
    { path: at('schema.ts'), contents: schemaTs(names) },
    { path: at('domain/types.ts'), contents: domainTypes(names) },
    { path: at('domain/events.ts'), contents: domainEvents(names) },
    { path: at(`service/${names.kebab}.service.ts`), contents: serviceTs(names) },
    { path: at(`api/${names.kebab}.module.ts`), contents: moduleTs(names) },
    { path: at(`tests/${names.kebab}.int.test.ts`), contents: rlsIntTest(names) },
  ];
};
