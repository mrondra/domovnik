// @ts-check
import { defineConfig } from 'eslint/config';
import noLlmInLoop from './rules/no-llm-in-loop.js';
import indexIsBarrel from './rules/index-is-barrel.js';
import requireDirectoryReadme from './rules/require-directory-readme.js';
import requireUseClient from './rules/require-use-client.js';
import forbidUseClient from './rules/forbid-use-client.js';

/** The house rules from AGENTS.md §4: no escape hatches, small files, one way to do a thing. */
export default defineConfig({
  plugins: {
    domovnik: {
      rules: {
        'no-llm-in-loop': noLlmInLoop,
        'index-is-barrel': indexIsBarrel,
        'require-directory-readme': requireDirectoryReadme,
        'require-use-client': requireUseClient,
        'forbid-use-client': forbidUseClient,
      },
    },
  },
  rules: {
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
          {
            name: '@aws-sdk/client-s3',
            message: 'Use the storage module from packages/kernel/src/storage.',
          },
          {
            name: '@aws-sdk/s3-request-presigner',
            message: 'Use the storage module from packages/kernel/src/storage.',
          },
        ],
      },
    ],
    'domovnik/no-llm-in-loop': 'error',
  },
});
