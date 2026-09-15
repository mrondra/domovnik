import { createServer, type Server } from 'node:http';
import { pingDatabase } from '../../../packages/kernel/src/db/index';
import { logger } from '../../../packages/kernel/src/logger/index';

const OK = 200;
const UNAVAILABLE = 503;

const answer = async (): Promise<{ status: number; body: string }> => {
  try {
    await pingDatabase();
    return { status: OK, body: JSON.stringify({ status: 'ok', database: 'ok' }) };
  } catch (error) {
    logger().error({ error }, 'Health check failed');
    return { status: UNAVAILABLE, body: JSON.stringify({ status: 'error', database: 'error' }) };
  }
};

/**
 * A worker has no API, but an orchestrator still has to be able to ask whether it is alive — hence a
 * bare `node:http` listener rather than a second Nest application with an HTTP adapter.
 */
export const startHealthServer = (port: number): Server =>
  createServer((request, response) => {
    if (request.url !== '/health') {
      response.writeHead(404).end();
      return;
    }

    void answer().then(({ status, body }) => {
      response.writeHead(status, { 'content-type': 'application/json' }).end(body);
    });
  }).listen(port, '0.0.0.0');
