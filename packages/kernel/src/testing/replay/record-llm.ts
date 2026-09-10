import { mkdir, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { dirname } from 'node:path';
import { text as readBody } from 'node:stream/consumers';
import { AdapterError } from '../../errors/index';
import type { RecordedExchange } from './fixture';
import { close, listen, EVENT_STREAM, MESSAGES_PATH, type LlmReplay } from './server';

const UPSTREAM = 'https://api.anthropic.com';

export interface RecordOptions {
  /** Defaults to the public API; a different origin is useful when recording through a gateway. */
  readonly upstream?: string | undefined;
}

const forwardedHeaders = (headers: NodeJS.Dict<string | string[]>): [string, string][] =>
  Object.entries(headers).flatMap(([key, value]) =>
    typeof value === 'string' && key !== 'host' ? [[key, value] as [string, string]] : [],
  );

/** Proxies to the real API and writes what came back, so `replayLlm` has something to serve. */
export const recordLlm = (fixturePath: string, options: RecordOptions = {}): LlmReplay => {
  const upstream = options.upstream ?? UPSTREAM;
  const exchanges: RecordedExchange[] = [];
  let server: Server | undefined;

  return {
    start: async () => {
      server = createServer((request, response) => {
        void (async () => {
          const body = await readBody(request);
          const answer = await fetch(`${upstream}${request.url ?? MESSAGES_PATH}`, {
            method: request.method ?? 'POST',
            headers: forwardedHeaders(request.headers),
            body: body === '' ? null : body,
          });
          const text = await answer.text();
          exchanges.push({
            name: `exchange-${String(exchanges.length + 1)}`,
            when: { contains: [] },
            sse: text,
          });
          response.writeHead(answer.status, {
            'content-type': answer.headers.get('content-type') ?? EVENT_STREAM,
          });
          response.end(text);
        })();
      });
      return listen(server);
    },
    stop: async () => {
      if (server !== undefined) await close(server);
      server = undefined;
      if (exchanges.length === 0) {
        throw new AdapterError('Nahrávání neposbíralo žádnou odpověď', {
          code: 'llm_record_empty',
          retryable: false,
        });
      }
      await mkdir(dirname(fixturePath), { recursive: true });
      await writeFile(fixturePath, `${JSON.stringify({ exchanges }, null, 2)}\n`);
    },
  };
};
