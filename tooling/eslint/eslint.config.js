// @ts-check
import { join } from 'node:path';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import vitest from '@vitest/eslint-plugin';
import noRestrictedPatterns from './rules/no-llm-in-loop.js';
import indexIsBarrel from './rules/index-is-barrel.js';
import requireDirectoryReadme from './rules/require-directory-readme.js';
import requireUseClient from './rules/require-use-client.js';
import forbidUseClient from './rules/forbid-use-client.js';

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
 * Everywhere React components live: the UI kit, a feature's own screens and the shell that mounts
 * them. The `*.client.tsx` convention is enforced in all three (docs/engineering.md §3).
 */
const UI_FILES = ['packages/shared/src/ui/**', 'packages/features/*/ui/**', 'apps/web/src/**'];

/**
 * Imports are relative and carry no extension (ADR 0010). The bundled node resolver does not try
 * `.ts`/`.tsx`, so without the TypeScript resolver every import stays unresolved and the boundaries
 * rules silently pass everything.
 */
const TS_CONFIG = join(import.meta.dirname, '../../tsconfig.base.json');

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      // Written by `next build`, down to the triple-slash references it points at `.next`.
      '**/next-env.d.ts',
      '**/node_modules/**',
      '**/drizzle/**',
      '**/*.cjs',
      'tooling/**',
      'eslint.config.js',
      'commitlint.config.js',
      'vitest.config.ts',
    ],
  },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true } },
    plugins: {
      boundaries,
      vitest,
      domovnik: {
        rules: {
          'no-llm-in-loop': noRestrictedPatterns,
          'index-is-barrel': indexIsBarrel,
          'require-directory-readme': requireDirectoryReadme,
          'require-use-client': requireUseClient,
          'forbid-use-client': forbidUseClient,
        },
      },
    },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'apps/*', capture: ['app'] },
        { type: 'kernel', pattern: 'packages/kernel' },
        { type: 'shared', pattern: 'packages/shared' },
        { type: 'db', pattern: 'packages/db' },
        { type: 'feature', pattern: 'packages/features/*', capture: ['feature'] },
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
      // ---- boundaries ----
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
          ],
        },
      ],
      'boundaries/no-unknown-files': 'error',
      // ---- escape hatches ----
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          minimumDescriptionLength: 15,
        },
      ],
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: false },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': 'error',
      'max-lines': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Error']",
          message: 'Use the error taxonomy from packages/kernel/src/errors.',
        },
        { selector: 'TSAsExpression > TSUnknownKeyword', message: 'No `as unknown as` casts.' },
        {
          selector: "CallExpression[callee.property.name='disable']",
          message: 'Do not disable rules programmatically.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'drizzle-orm/node-postgres', message: 'Use withTenant() from packages/kernel/src/db.' },
            { name: 'pg', message: 'Use withTenant() from packages/kernel/src/db.' },
            {
              name: '@anthropic-ai/sdk',
              message: 'Use the agent runtime / llm client from packages/kernel/src.',
            },
          ],
        },
      ],
      'domovnik/no-llm-in-loop': 'error',
      // ---- eslint-disable only with a justification (enforced by eslint-comments) ----
    },
  },
  {
    files: ['**/*.test.ts', '**/*.int.test.ts', '**/*.contract.test.ts'],
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/expect-expect': 'error',
      'vitest/valid-title': ['error', { mustMatch: { it: ['^(?!should).+'] } }], // "rejects duplicate", not "should reject"
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
    },
  },
  {
    files: ['**/index.ts'],
    rules: {
      'domovnik/index-is-barrel': 'error',
      'domovnik/require-directory-readme': 'error',
    },
  },
  {
    files: ['packages/kernel/src/db/**'],
    rules: { 'no-restricted-imports': 'off' }, // the only place allowed to use the pg/drizzle client
  },
  {
    files: ['packages/kernel/src/llm/**', 'packages/kernel/src/agents/**'],
    rules: { 'no-restricted-imports': 'off' }, // the only place allowed to use the Anthropic SDKs
  },
  {
    files: [
      'packages/features/*/api/*.module.ts',
      'apps/*/src/**/*.module.ts',
      'apps/api/src/tests/*.fixture.ts',
    ],
    // A Nest module is a decorated marker class; it has no members and is not supposed to.
    rules: { '@typescript-eslint/no-extraneous-class': 'off' },
  },
  {
    files: UI_FILES.map((pattern) => `${pattern}/*.client.tsx`),
    rules: { 'domovnik/require-use-client': 'error' },
  },
  {
    files: UI_FILES.map((pattern) => `${pattern}/*.tsx`),
    ignores: ['**/*.client.tsx'],
    rules: { 'domovnik/forbid-use-client': 'error' },
  },
);
