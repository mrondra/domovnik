import { mkdtemp } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createContext, type RequestContext } from '../context/index';
import { newId, tenantIdSchema, userIdSchema } from '../ids/index';
import { applyTestEnv } from '../testing/env';
import { resetAnthropicClient } from './client';
import { llm } from './index';

const message = (text: string) => ({
  id: 'msg_1',
  type: 'message',
  role: 'assistant',
  model: 'claude-haiku-4-5',
  content: [{ type: 'text', text }],
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: { input_tokens: 120, output_tokens: 8 },
});

let server: Server;
let fixtureDir: string;
let ctx: RequestContext;

const start = (): Promise<string> =>
  new Promise((resolve) => {
    server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(message('{"supplier":"Výtahy s.r.o.","total":1200}')));
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      resolve(`http://127.0.0.1:${String(port)}`);
    });
  });

beforeAll(async () => {
  fixtureDir = await mkdtemp(join(tmpdir(), 'domovnik-llm-'));
  const baseUrl = await start();
  applyTestEnv({ ANTHROPIC_BASE_URL: baseUrl, LLM_MODE: 'record', LLM_FIXTURE_DIR: fixtureDir });
  resetAnthropicClient();
  ctx = createContext({
    tenantId: newId(tenantIdSchema),
    actor: { type: 'user', id: newId(userIdSchema), roles: ['finance'] },
  });
});

afterAll(() => {
  server.close();
});

const replay = (): void => {
  applyTestEnv({ LLM_MODE: 'replay', LLM_FIXTURE_DIR: fixtureDir });
};

describe('llm.complete', () => {
  it('records a live answer and replays it without a request', async () => {
    const live = await llm.complete(ctx, { prompt: 'Shrň fakturu', system: 'Jsi účetní.' });
    expect(live.usage.inputTokens).toBe(120);

    replay();
    server.close();
    const replayed = await llm.complete(ctx, { prompt: 'Shrň fakturu', system: 'Jsi účetní.' });
    expect(replayed).toEqual(live);
  });

  it('reports a missing fixture instead of falling back to the network', async () => {
    replay();
    await expect(llm.complete(ctx, { prompt: 'nenahrané' })).rejects.toThrow(/Chybí LLM fixture/);
  });
});

describe('llm.classify', () => {
  it('answers with one of the offered labels', async () => {
    const baseUrl = await start();
    applyTestEnv({ ANTHROPIC_BASE_URL: baseUrl, LLM_MODE: 'record', LLM_FIXTURE_DIR: fixtureDir });
    resetAnthropicClient();
    server.close();
    server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(message('{"label":"faktura"}')));
    });
    await new Promise<void>((resolve) => {
      server.listen(Number(new URL(baseUrl).port), '127.0.0.1', resolve);
    });

    const classified = await llm.classify(ctx, ['faktura', 'upomínka'], { prompt: 'Co to je?' });
    expect(classified.label).toBe('faktura');
  });
});

describe('llm.extract', () => {
  it('returns a value validated against the caller schema', async () => {
    const baseUrl = await start();
    applyTestEnv({ ANTHROPIC_BASE_URL: baseUrl, LLM_MODE: 'record', LLM_FIXTURE_DIR: fixtureDir });
    resetAnthropicClient();

    const schema = z.object({ supplier: z.string(), total: z.number() });
    const live = await llm.extract(ctx, schema, { prompt: 'Vytáhni dodavatele a částku' });
    expect(live.value).toEqual({ supplier: 'Výtahy s.r.o.', total: 1200 });

    replay();
    server.close();
    const replayed = await llm.extract(ctx, schema, { prompt: 'Vytáhni dodavatele a částku' });
    expect(replayed.value).toEqual(live.value);
  });
});
