import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

/**
 * The suite talks to a real API over a real Postgres: it seeds through the kernel and then drives
 * the browser, so what it proves is the whole path, not a mock of it. Infrastructure comes from
 * `docker compose`; the two application servers are started here.
 */
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const WEB_URL = 'http://localhost:3000';
const STARTUP_TIMEOUT = 180_000;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  reporter: process.env['CI'] === undefined ? 'list' : 'github',
  use: { baseURL: WEB_URL, trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'pnpm --filter @domovnik/api dev',
      url: 'http://localhost:3001/health',
      cwd: repoRoot,
      reuseExistingServer: true,
      timeout: STARTUP_TIMEOUT,
    },
    {
      command: 'pnpm --filter @domovnik/web dev',
      url: WEB_URL,
      cwd: repoRoot,
      reuseExistingServer: true,
      timeout: STARTUP_TIMEOUT,
    },
  ],
});
