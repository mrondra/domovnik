import { defineConfig } from 'tsup';

/**
 * The bundle exists for exactly one reason: relative imports carry no extension (ADR 0010), which
 * Node refuses to run as ESM. So **only relative imports are bundled** — this app and the kernel it
 * reaches through `../../../packages/kernel/…` — and every bare specifier stays external, resolved
 * by Node from `node_modules` at run time. That keeps native addons (`@node-rs/argon2`) and Nest's
 * lazy `require()`s of optional packages working, neither of which survives being inlined.
 *
 * CommonJS, because `require('./x')` resolves the same specifier the type checker does. Decorator
 * metadata comes from SWC — esbuild alone does not emit it, and Nest's DI reads it.
 */
export default defineConfig({
  entry: ['src/main.ts'],
  outDir: 'dist',
  format: ['cjs'],
  platform: 'node',
  target: 'node24',
  external: [/^[^./]/],
  sourcemap: true,
  clean: true,
});
