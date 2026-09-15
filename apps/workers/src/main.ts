import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { loadEnv } from '../../../packages/kernel/src/env/index';
import { logger } from '../../../packages/kernel/src/logger/index';
import { WorkersModule } from './workers.module';

/**
 * Standalone: there is no HTTP surface to serve, only a Nest context for dependency injection and
 * its lifecycle hooks. What the process does lives in `WorkersService`.
 */
const start = async (): Promise<void> => {
  loadEnv();
  const app = await NestFactory.createApplicationContext(WorkersModule, { logger: false });
  app.enableShutdownHooks();
  logger().info('Workers started');
};

void start();
