import type { NextConfig } from 'next';

/**
 * No `transpilePackages`: that option exists for packages resolved out of `node_modules`, and this
 * repository imports the kernel and the UI kit by relative path (ADR 0010), so Next compiles those
 * files as ordinary sources of this application. `outputFileTracingRoot` points at the repository
 * root because those sources live above `apps/web`.
 *
 * Linting is `pnpm lint` over the whole repository, with the shared config; Next's own pass would
 * be a second, differently configured linter over a subset of the same files.
 */
const config: NextConfig = {
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  eslint: { ignoreDuringBuilds: true },
};

export default config;
