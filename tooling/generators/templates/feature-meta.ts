import type { Names } from '../lib/names';
import type { FeatureDependencies } from '../lib/versions';

const sorted = (entries: Readonly<Record<string, string>>): Readonly<Record<string, string>> =>
  Object.fromEntries(Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)));

export const packageJson = (names: Names, dependencies: FeatureDependencies): string =>
  `${JSON.stringify(
    {
      name: `@domovnik/feature-${names.kebab}`,
      version: '0.0.0',
      private: true,
      type: 'module',
      exports: { '.': './index.ts' },
      scripts: { typecheck: 'tsc --noEmit' },
      dependencies: sorted(dependencies.dependencies),
      devDependencies: sorted(dependencies.devDependencies),
    },
    null,
    2,
  )}\n`;

export const tsconfigJson = (): string =>
  `${JSON.stringify(
    {
      extends: '../../../tsconfig.base.json',
      // `preserve` leaves JSX to the bundler; the UI stack itself arrives with apps/web.
      compilerOptions: { noEmit: true, jsx: 'preserve' },
      include: ['**/*.ts', '**/*.tsx'],
    },
    null,
    2,
  )}\n`;

export const readme = (names: Names): string => `# ${names.kebab}

<What this feature owns, in one sentence.>

| File / directory | Contents                                                         |
| ---------------- | ---------------------------------------------------------------- |
| \`schema.ts\`      | tables, always through \`tenantTable\`/\`svjTable\`                     |
| \`domain/\`        | types and event definitions, no I/O                              |
| \`service/\`       | the only place that mutates; emits events and writes audit rows  |
| \`api/\`           | the Nest module \`apps/api\` discovers                             |
| \`tests/\`         | unit tests plus the RLS isolation test for every table           |
| \`index.ts\`       | the public face: what other features and apps may import         |

**The rule:** everything outside this directory sees the feature through \`index.ts\` only. Reach
another feature through its \`index.ts\` or an event, never through its tables (docs/engineering.md §2).
`;
