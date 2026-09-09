// @ts-check
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import vitest from '@vitest/eslint-plugin';
import noRestrictedPatterns from './rules/no-llm-in-loop.js';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/drizzle/**',
      '**/*.cjs',
      'tooling/**',
      'eslint.config.js',
      'commitlint.config.js',
      'vitest.workspace.ts',
    ],
  },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true } },
    plugins: { boundaries, vitest, domovnik: { rules: { 'no-llm-in-loop': noRestrictedPatterns } } },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'apps/*', mode: 'folder', capture: ['app'] },
        { type: 'kernel', pattern: 'packages/kernel', mode: 'folder' },
        { type: 'shared', pattern: 'packages/shared', mode: 'folder' },
        { type: 'db', pattern: 'packages/db', mode: 'folder' },
        {
          type: 'feature-public',
          pattern: 'packages/features/*/index.ts',
          mode: 'file',
          capture: ['feature'],
        },
        { type: 'feature', pattern: 'packages/features/*', mode: 'folder', capture: ['feature'] },
      ],
      'boundaries/ignore': ['**/*.test.ts', '**/*.int.test.ts', '**/*.contract.test.ts', '**/*.eval.ts'],
    },
    rules: {
      // ---- hranice ----
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'shared', allow: [] },
            { from: 'kernel', allow: ['shared'] },
            { from: 'db', allow: ['kernel', 'shared', 'feature-public', 'feature'] }, // db skládá schema.ts
            {
              from: 'feature',
              allow: ['kernel', 'shared', 'feature-public', ['feature', { feature: '${from.feature}' }]],
            },
            { from: 'app', allow: ['kernel', 'shared', 'db', 'feature-public'] },
          ],
        },
      ],
      'boundaries/no-unknown-files': 'error',
      // ---- únikové cesty ----
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
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Error']",
          message: 'Use error taxonomy from @domovnik/kernel/errors.',
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
            { name: 'drizzle-orm/node-postgres', message: 'Use withTenant() from @domovnik/kernel/db.' },
            { name: 'pg', message: 'Use withTenant() from @domovnik/kernel/db.' },
            { name: '@anthropic-ai/sdk', message: 'Use agent runtime / llm client from @domovnik/kernel.' },
          ],
          patterns: [
            {
              group: ['@domovnik/features/*/!(index)', '@domovnik/features/*/*/**'],
              message: 'Import features only via their index.ts.',
            },
          ],
        },
      ],
      'domovnik/no-llm-in-loop': 'error',
      // ---- eslint-disable jen se zdůvodněním (hlídá eslint-comments) ----
    },
  },
  {
    files: ['**/*.test.ts', '**/*.int.test.ts', '**/*.contract.test.ts'],
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/expect-expect': 'error',
      'vitest/valid-title': ['error', { mustMatch: { it: ['^(?!should).+'] } }], // "rejects duplicate", ne "should reject"
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
    },
  },
  {
    files: ['packages/kernel/src/db/**'],
    rules: { 'no-restricted-imports': 'off' }, // jediné místo, kde smí být pg/drizzle klient
  },
  {
    files: ['packages/features/*/ui/**/*.client.tsx'],
    rules: { 'domovnik/require-use-client': 'error' },
  },
  {
    files: ['packages/features/*/ui/**/*.tsx'],
    ignores: ['**/*.client.tsx'],
    rules: { 'domovnik/forbid-use-client': 'error' },
  },
);
