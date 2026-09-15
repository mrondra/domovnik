import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

/**
 * The bundle exists for exactly one reason: relative imports carry no extension (ADR 0010), which
 * Node refuses to run as ESM. So **only relative imports are bundled** — this app and the kernel it
 * reaches through `../../../packages/kernel/…` — and every bare specifier stays external, resolved
 * by Node from `node_modules` at run time. That keeps native addons (`@node-rs/argon2`) and Nest's
 * lazy `require()`s of optional packages working, neither of which survives being inlined.
 *
 * CommonJS, because `require('./x')` resolves the same specifier the type checker does. Decorator
 * metadata comes from SWC — esbuild alone does not emit it, and Nest's DI reads it, which is also
 * why `pnpm dev` runs this build in watch mode instead of `tsx`.
 */

/** tsup runs with `apps/api` as the working directory, like every other script here. */
const ENV_FILE = resolve(process.cwd(), '../../.env');

/**
 * Read by the watcher so the process it starts inherits it. It cannot be a flag on that process:
 * tsup mangles an `onSuccess` string containing one, and `--env-file-if-exists=…` reaches
 * `/bin/sh` in pieces.
 */
const loadDevEnv = (): void => {
  if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
};

export default defineConfig((options) => {
  const isWatching = options.watch !== undefined && options.watch !== false;
  if (isWatching) loadDevEnv();

  return {
    entry: ['src/main.ts'],
    outDir: 'dist',
    format: ['cjs'],
    platform: 'node',
    target: 'node24',
    external: [/^[^./]/],
    sourcemap: true,
    clean: true,
    /** Starting the process belongs to the watch run, not to `pnpm build`. */
    ...(isWatching ? { onSuccess: 'node dist/main.cjs' } : {}),
  };
});
