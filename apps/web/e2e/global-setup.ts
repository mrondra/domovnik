import type { Server } from 'node:http';
import { startAgentReplay } from './agent-replay';

let replay: Server | undefined;

/**
 * Everything the suite needs that is not a server Playwright can poll: the model, replaced by a
 * local endpoint. `apps/workers` is pointed at it through `ANTHROPIC_BASE_URL` in the Playwright
 * config, so an agent run during the walkthrough never leaves the machine (task 026).
 */
const globalSetup = async (): Promise<() => Promise<void>> => {
  replay = await startAgentReplay();

  return () =>
    new Promise((resolve) => {
      replay?.close(() => {
        resolve();
      });
    });
};

export default globalSetup;
