import 'reflect-metadata';
import { closeConnections } from '../../../packages/kernel/src/db/index';
import { logger } from '../../../packages/kernel/src/logger/index';
import { buildApp } from './bootstrap';

const PORT = 3001;

/**
 * Wrapped rather than top-level: the production build is CommonJS (see `tsup.config.ts`), and
 * CommonJS has no top-level await.
 */
const start = async (): Promise<void> => {
  const app = await buildApp();

  /** Drizzle's pools keep the process alive on their own; shutting down means ending them. */
  app.enableShutdownHooks();
  process.on('beforeExit', () => {
    void closeConnections();
  });

  await app.listen({ port: PORT, host: '0.0.0.0' });
  logger().info({ port: PORT }, 'API naslouchá');
};

void start();
