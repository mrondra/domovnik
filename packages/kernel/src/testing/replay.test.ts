import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { recordLlm, replayLlm, type LlmFixture, type LlmReplay } from './replay/index';

const fixture: LlmFixture = {
  exchanges: [
    {
      name: 'tool-call',
      when: { contains: ['invoice_get'], missing: ['tool_result'] },
      message: {
        id: 'msg_1',
        model: 'claude-sonnet-5',
        content: [{ type: 'tool_use', id: 't1', name: 'invoice_get', input: { invoiceId: 'x' } }],
        stopReason: 'tool_use',
        inputTokens: 10,
        outputTokens: 2,
      },
    },
    {
      name: 'final',
      when: { contains: ['tool_result'] },
      sse: 'event: message_stop\ndata: {"type":"message_stop"}\n\n',
    },
  ],
};

let running: LlmReplay | undefined;

afterEach(async () => {
  await running?.stop();
  running = undefined;
});

const writeFixture = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'domovnik-fixture-'));
  const path = join(dir, 'replay.json');
  await writeFile(path, JSON.stringify(fixture));
  return path;
};

describe('replayLlm', () => {
  it('answers by matching the request content, not its order', async () => {
    running = replayLlm(await writeFixture());
    const base = await running.start();

    const second = await fetch(`${base}/v1/messages?beta=true`, {
      method: 'POST',
      body: JSON.stringify({ messages: [{ content: [{ type: 'tool_result' }] }] }),
    });
    const first = await fetch(`${base}/v1/messages?beta=true`, {
      method: 'POST',
      body: JSON.stringify({ tools: [{ name: 'invoice_get' }] }),
    });

    expect(await second.text()).toContain('message_stop');
    expect(await first.text()).toContain('input_json_delta');
  });

  it('rejects a request no exchange describes', async () => {
    running = replayLlm(await writeFixture());
    const base = await running.start();

    const response = await fetch(`${base}/v1/messages`, { method: 'POST', body: '{}' });
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('nemá odpověď');
  });

  it('ignores every other endpoint', async () => {
    running = replayLlm(await writeFixture());
    const base = await running.start();
    expect((await fetch(`${base}/api/hello`)).status).toBe(404);
  });
});

describe('recordLlm', () => {
  it('refuses to write a fixture with nothing in it', async () => {
    const recorder = recordLlm(join(tmpdir(), 'never-written.json'));
    await recorder.start();
    await expect(recorder.stop()).rejects.toThrow(/neposbíralo/);
  });

  it('writes what the upstream answered', async () => {
    const upstream = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      response.end('event: message_stop\ndata: {"type":"message_stop"}\n\n');
    });
    const upstreamUrl = await new Promise<string>((resolve) => {
      upstream.listen(0, '127.0.0.1', () => {
        const address = upstream.address();
        resolve(
          `http://127.0.0.1:${String(typeof address === 'object' && address !== null ? address.port : 0)}`,
        );
      });
    });

    const dir = await mkdtemp(join(tmpdir(), 'domovnik-record-'));
    const path = join(dir, 'recorded.json');
    const recorder = recordLlm(path, { upstream: upstreamUrl });
    const base = await recorder.start();

    await fetch(`${base}/v1/messages`, { method: 'POST', body: '{"model":"claude-sonnet-5"}' });
    await recorder.stop();
    upstream.close();

    expect(await readFile(path, 'utf8')).toContain('message_stop');
  });
});
