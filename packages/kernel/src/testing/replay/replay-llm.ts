import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { text as readBody } from 'node:stream/consumers';
import { toEventStream } from '../sse';
import { fixtureSchema, type RecordedExchange } from './fixture';
import { close, listen, EVENT_STREAM, MESSAGES_PATH, type LlmReplay } from './server';

const matches = (exchange: RecordedExchange, body: string): boolean =>
  (exchange.when.contains ?? []).every((fragment) => body.includes(fragment)) &&
  (exchange.when.missing ?? []).every((fragment) => !body.includes(fragment));

const bodyOf = (exchange: RecordedExchange): string =>
  exchange.sse ?? (exchange.message === undefined ? '' : toEventStream(exchange.message));

/**
 * Serves recorded Messages API answers instead of the network. Matching is by request content, not
 * by order: the agent process interleaves its own housekeeping calls and retries failures.
 */
export const replayLlm = (fixturePath: string): LlmReplay => {
  let server: Server | undefined;

  return {
    start: async () => {
      const fixture = fixtureSchema.parse(JSON.parse(await readFile(fixturePath, 'utf8')));

      server = createServer((request, response) => {
        void (async () => {
          if (request.url?.startsWith(MESSAGES_PATH) !== true) {
            response.writeHead(404).end();
            return;
          }
          const body = await readBody(request);
          const exchange = fixture.exchanges.find((candidate) => matches(candidate, body));
          if (exchange === undefined) {
            response.writeHead(400, { 'content-type': 'application/json' });
            response.end(
              JSON.stringify({
                type: 'error',
                error: {
                  type: 'invalid_request_error',
                  message: `Fixture ${fixturePath} nemá odpověď`,
                },
              }),
            );
            return;
          }
          response.writeHead(200, { 'content-type': EVENT_STREAM });
          response.end(bodyOf(exchange));
        })();
      });

      return listen(server);
    },
    stop: async () => {
      if (server !== undefined) await close(server);
      server = undefined;
    },
  };
};
