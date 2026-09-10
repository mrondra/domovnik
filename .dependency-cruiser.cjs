/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: { orphan: true, pathNot: ['\\.d\\.ts$', 'index\\.ts$', 'config'] },
      to: {},
    },
    {
      name: 'kernel-knows-no-feature',
      severity: 'error',
      from: { path: '^packages/kernel' },
      to: { path: '^packages/(features|db)' },
    },
    {
      name: 'shared-knows-nothing',
      severity: 'error',
      from: { path: '^packages/shared' },
      to: { path: '^packages/(kernel|features|db)|^apps' },
    },
    {
      name: 'feature-via-index-only',
      severity: 'error',
      from: { path: '^packages/features/([^/]+)/' },
      to: { path: '^packages/features/(?!$1/)[^/]+/(?!index\\.ts$).+' },
    },
    {
      name: 'apps-no-feature-internals',
      severity: 'error',
      from: { path: '^apps/' },
      to: { path: '^packages/features/[^/]+/(?!index\\.ts$)' },
    },
    {
      name: 'no-direct-db-client',
      severity: 'error',
      from: { pathNot: '^packages/kernel/src/db' },
      // The trailing slash keeps `pg-boss` out of the match; only the Postgres client is meant.
      to: { path: 'node_modules/(pg|drizzle-orm/node-postgres)/' },
    },
    {
      name: 'no-direct-anthropic',
      severity: 'error',
      from: { pathNot: '^packages/kernel/src/(llm|agents)' },
      to: { path: 'node_modules/@anthropic-ai' },
    },
    {
      name: 'ui-no-service',
      severity: 'error',
      from: { path: '^packages/features/[^/]+/ui/' },
      to: { path: '^packages/features/[^/]+/(service|adapters|schema)' },
    },
    {
      name: 'no-test-in-prod',
      severity: 'error',
      from: { pathNot: '\\.(test|int\\.test|contract\\.test|eval|fixture)\\.ts$' },
      to: { path: '\\.(test|int\\.test|contract\\.test|eval|fixture)\\.ts$|/tests/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    reporterOptions: { dot: { collapsePattern: '^(packages/features/[^/]+|packages/[^/]+|apps/[^/]+)' } },
  },
};
