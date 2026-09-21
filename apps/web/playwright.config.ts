import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { AGENT_REPLAY_PORT } from './e2e/agent-replay';

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

/**
 * The workers run the subscribers and the agents, so the walkthrough in `phase1.e2e.ts` needs them
 * up. Everything they would ask a model is answered by the endpoint `globalSetup` starts — the
 * extraction of the invoice and every agent run alike — so nothing in the suite touches the
 * network. The fixtures recorded next to the feature tests cannot serve here: they were recorded
 * against the houses a test makes up, not against the houses the seed writes.
 */
const OFFLINE_LLM = {
  ANTHROPIC_BASE_URL: `http://127.0.0.1:${String(AGENT_REPLAY_PORT)}`,
  ANTHROPIC_API_KEY: 'replay',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  reporter: process.env['CI'] === undefined ? 'list' : 'github',
  // The walkthrough waits for workers: an agent run is a subprocess and a statement is a year of
  // movements, so a step of it is minutes rather than seconds.
  timeout: 240_000,
  expect: { timeout: 15_000 },
  use: { baseURL: WEB_URL, trace: 'retain-on-failure' },
  globalSetup: fileURLToPath(new URL('./e2e/global-setup.ts', import.meta.url)),
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
    {
      command: 'pnpm --filter @domovnik/workers start',
      url: 'http://localhost:3002/health',
      cwd: repoRoot,
      reuseExistingServer: false,
      timeout: STARTUP_TIMEOUT,
      env: OFFLINE_LLM,
    },
  ],
});
