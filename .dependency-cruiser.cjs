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
      // Two front doors, both public: `index.ts` is the server side, `ui/index.ts` the browser one
      // (ADR 0017). Everything else behind them is the feature's own business.
      name: 'feature-via-index-only',
      severity: 'error',
      from: { path: '^packages/features/([^/]+)/' },
      to: { path: '^packages/features/(?!$1/)[^/]+/(?!index\\.ts$|ui/index\\.ts$).+' },
    },
    {
      name: 'apps-no-feature-internals',
      severity: 'error',
      from: { path: '^apps/' },
      to: { path: '^packages/features/[^/]+/(?!index\\.ts$|ui/index\\.ts$)' },
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
      // One bucket for the whole platform, separated by a key prefix: the prefix check lives in
      // `storage/keys.ts`, so a caller reaching for the SDK would be reaching past it.
      name: 'no-direct-s3',
      severity: 'error',
      from: { pathNot: '^packages/kernel/src/storage' },
      to: { path: 'node_modules/@aws-sdk/(client-s3|s3-request-presigner)/' },
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
    // Build output, not source: a bundle inlines the kernel and would trip every layering rule.
    exclude: { path: '(^|/)(dist|\\.next|\\.turbo)/' },
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    reporterOptions: { dot: { collapsePattern: '^(packages/features/[^/]+|packages/[^/]+|apps/[^/]+)' } },
  },
};
