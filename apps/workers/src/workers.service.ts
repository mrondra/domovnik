import { Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import type { Server } from 'node:http';
import { closeConnections } from '../../../packages/kernel/src/db/index';
import { startHealthServer } from './health';
import { startRuntime, type Runtime } from './runtime/index';

const HEALTH_PORT = 3002;

/**
 * The process as a Nest provider, so `enableShutdownHooks()` is what drains the queue: SIGTERM stops
 * accepting jobs, lets the running ones finish, and only then ends the database pools.
 */
@Injectable()
export class WorkersService implements OnApplicationBootstrap, OnApplicationShutdown {
  private runtime?: Runtime;
  private health?: Server;

  async onApplicationBootstrap(): Promise<void> {
    this.runtime = await startRuntime();
    this.health = startHealthServer(HEALTH_PORT);
  }

  async onApplicationShutdown(): Promise<void> {
    this.health?.close();
    await this.runtime?.stop();
    await closeConnections();
  }
}
