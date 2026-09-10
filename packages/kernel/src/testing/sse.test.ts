import { describe, expect, it } from 'vitest';
import { toEventStream } from './sse';

describe('toEventStream', () => {
  it('frames a text answer as a Messages API stream', () => {
    const stream = toEventStream({
      id: 'msg_1',
      model: 'claude-sonnet-5',
      content: [{ type: 'text', text: 'Hotovo' }],
      stopReason: 'end_turn',
      inputTokens: 100,
      outputTokens: 7,
    });

    expect(stream).toContain('event: message_start');
    expect(stream).toContain('"text_delta"');
    expect(stream).toContain('Hotovo');
    expect(stream).toContain('"stop_reason":"end_turn"');
    expect(stream).toContain('"output_tokens":7');
    expect(stream.trimEnd().endsWith('{"type":"message_stop"}')).toBe(true);
  });

  it('tolerates a block with nothing in it', () => {
    const stream = toEventStream({
      id: 'msg_0',
      model: 'claude-sonnet-5',
      content: [{ type: 'text' }, { type: 'tool_use', id: 't', name: 'noop' }],
      stopReason: 'end_turn',
      inputTokens: 1,
      outputTokens: 1,
    });
    expect(stream).toContain('"text":""');
    expect(stream).toContain('"partial_json":"{}"');
  });

  it('frames a tool call with its arguments', () => {
    const stream = toEventStream({
      id: 'msg_2',
      model: 'claude-sonnet-5',
      content: [
        { type: 'tool_use', id: 'toolu_1', name: 'mcp__domovnik__invoice_get', input: { invoiceId: 'x' } },
      ],
      stopReason: 'tool_use',
      inputTokens: 100,
      outputTokens: 3,
    });

    expect(stream).toContain('"input_json_delta"');
    expect(stream).toContain('mcp__domovnik__invoice_get');
    expect(stream).toContain('"stop_reason":"tool_use"');
  });
});
