import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        'packages/kernel/src/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'packages/features/*/service/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['packages/**/src/**/*.test.ts', 'packages/features/**/tests/**/*.test.ts'],
          exclude: ['**/*.int.test.ts', '**/*.contract.test.ts', '**/*.eval.ts'],
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          include: ['packages/**/*.int.test.ts', 'packages/**/*.contract.test.ts'],
          // DATABASE_URL is inherited from the environment (docker compose locally, service in CI)
          pool: 'forks',
          fileParallelism: false,
        },
      }),
      defineProject({
        test: {
          name: 'evals',
          include: ['packages/**/*.eval.ts'],
        },
      }),
    ],
  },
});
