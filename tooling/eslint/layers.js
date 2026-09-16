// @ts-check
import { join } from 'node:path';
import { defineConfig } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';

/**
 * From outside, a feature may only be imported through one of its two front doors: `index.ts` is the
 * server side (Nest module, service, events), `ui/index.ts` the browser one (screens, navigation,
 * the wire schemas). A Next build cannot follow the first and a Nest build cannot follow the second,
 * which is why there are two (ADR 0017).
 */
const FEATURE_PUBLIC = [
  { element: { type: 'feature', fileInternalPath: 'index.ts' } },
  { element: { type: 'feature', fileInternalPath: 'ui/index.ts' } },
];

/**
 * Imports are relative and carry no extension (ADR 0010). The bundled node resolver does not try
 * `.ts`/`.tsx`, so without the TypeScript resolver every import stays unresolved and the boundaries
 * rules silently pass everything.
 */
const TS_CONFIG = join(import.meta.dirname, '../../tsconfig.base.json');

/** The architecture of the repo, and who in it may import whom. */
export default defineConfig({
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [
      { type: 'app', pattern: 'apps/*', capture: ['app'] },
      { type: 'kernel', pattern: 'packages/kernel' },
      { type: 'shared', pattern: 'packages/shared' },
      { type: 'db', pattern: 'packages/db' },
      { type: 'feature', pattern: 'packages/features/*', capture: ['feature'] },
      { type: 'tooling', pattern: 'tooling/*', capture: ['tool'] },
    ],
    'boundaries/ignore': [
      '**/*.test.ts',
      '**/*.int.test.ts',
      '**/*.contract.test.ts',
      '**/*.eval.ts',
      '**/*.fixture.ts',
    ],
    'import/resolver': { typescript: { project: TS_CONFIG } },
  },
  rules: {
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        policies: [
          { from: [{ element: { type: 'shared' } }], allow: [] },
          { from: [{ element: { type: 'kernel' } }], allow: [{ to: { element: { type: 'shared' } } }] },
          {
            from: [{ element: { type: 'db' } }], // db composes the feature schema.ts files
            allow: [{ to: { element: { type: ['kernel', 'shared', 'feature'] } } }],
          },
          {
            from: [{ element: { type: 'feature' } }],
            allow: [
              { to: { element: { type: ['kernel', 'shared'] } } },
              {
                to: {
                  element: {
                    type: 'feature',
                    captured: { feature: '{{ from.element.captured.feature }}' },
                  },
                },
              },
              ...FEATURE_PUBLIC.map((to) => ({ to })),
            ],
          },
          {
            from: [{ element: { type: 'app' } }],
            allow: [
              { to: { element: { type: ['kernel', 'shared', 'db'] } } },
              ...FEATURE_PUBLIC.map((to) => ({ to })),
            ],
          },
          {
            // Generators write into the apps they scaffold for, so they read those apps' composers.
            from: [{ element: { type: 'tooling' } }],
            allow: [
              { to: { element: { type: 'app' } } },
              {
                to: { element: { type: 'tooling', captured: { tool: '{{ from.element.captured.tool }}' } } },
              },
            ],
          },
        ],
      },
    ],
    'boundaries/no-unknown-files': 'error',
  },
});
