// @ts-check
import { defineConfig } from 'eslint/config';
import vitest from '@vitest/eslint-plugin';

/**
 * Everywhere React components live: the UI kit, a feature's own screens and the shell that mounts
 * them. The `*.client.tsx` convention is enforced in all three (docs/engineering.md §3).
 */
const UI_FILES = ['packages/shared/src/ui/**', 'packages/features/*/ui/**', 'apps/web/src/**'];

/** Where the house rules bend, each with the reason it bends there. */
export default defineConfig([
  {
    files: ['*.js', '*.cjs', '*.ts', '.*.cjs'],
    // The repo's own configuration sits at the root, outside the architecture it configures.
    rules: { 'boundaries/no-unknown-files': 'off' },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    // A JavaScript file carries its types in JSDoc; there is no annotation syntax to require.
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.int.test.ts', '**/*.contract.test.ts'],
    plugins: { vitest },
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
]);
