import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: [
      defineProject({
        test: {
          name: 'unit',
          include: ['packages/**/src/**/*.test.ts', 'packages/features/**/tests/**/*.test.ts'],
          exclude: ['**/*.int.test.ts', '**/*.contract.test.ts', '**/*.eval.ts'],
          coverage: {
            provider: 'v8',
            thresholds: {
              'packages/kernel/src/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
              'packages/features/*/service/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
            },
          },
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          include: ['packages/**/*.int.test.ts', 'packages/**/*.contract.test.ts'],
          pool: 'forks',
          poolOptions: { forks: { singleFork: true } },
          env: { DATABASE_URL: 'postgresql://domovnik:domovnik@localhost:5432/domovnik_test' },
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
