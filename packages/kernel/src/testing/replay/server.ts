import type { Server } from 'node:http';

export const MESSAGES_PATH = '/v1/messages';
export const EVENT_STREAM = 'text/event-stream';

export interface LlmReplay {
  /** Starts the fixture endpoint and returns the base URL to point the agent process at. */
  start(): Promise<string>;
  stop(): Promise<void>;
}

export const listen = (server: Server): Promise<string> =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      resolve(`http://127.0.0.1:${String(port)}`);
    });
  });

export const close = (server: Server): Promise<void> =>
  new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
