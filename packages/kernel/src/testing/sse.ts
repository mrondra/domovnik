export interface FixtureContentBlock {
  readonly type: 'text' | 'tool_use';
  readonly text?: string | undefined;
  readonly id?: string | undefined;
  readonly name?: string | undefined;
  readonly input?: Readonly<Record<string, unknown>> | undefined;
}

export interface FixtureMessage {
  readonly id: string;
  readonly model: string;
  readonly content: readonly FixtureContentBlock[];
  readonly stopReason: 'end_turn' | 'tool_use';
  readonly inputTokens: number;
  readonly outputTokens: number;
}

const frame = (event: string, data: unknown): string => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

const openingBlock = (block: FixtureContentBlock): unknown =>
  block.type === 'text'
    ? { type: 'text', text: '' }
    : { type: 'tool_use', id: block.id, name: block.name, input: {} };

const blockDelta = (block: FixtureContentBlock): unknown =>
  block.type === 'text'
    ? { type: 'text_delta', text: block.text ?? '' }
    : { type: 'input_json_delta', partial_json: JSON.stringify(block.input ?? {}) };

/** Turns a fixture message into the SSE stream the Messages API would have produced. */
export const toEventStream = (message: FixtureMessage): string => {
  const start = frame('message_start', {
    type: 'message_start',
    message: {
      id: message.id,
      type: 'message',
      role: 'assistant',
      model: message.model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: message.inputTokens, output_tokens: 0 },
    },
  });

  const blocks = message.content.flatMap((block, index) => [
    frame('content_block_start', {
      type: 'content_block_start',
      index,
      content_block: openingBlock(block),
    }),
    frame('content_block_delta', {
      type: 'content_block_delta',
      index,
      delta: blockDelta(block),
    }),
    frame('content_block_stop', { type: 'content_block_stop', index }),
  ]);

  const end = [
    frame('message_delta', {
      type: 'message_delta',
      delta: { stop_reason: message.stopReason, stop_sequence: null },
      usage: { output_tokens: message.outputTokens },
    }),
    frame('message_stop', { type: 'message_stop' }),
  ];

  return [start, ...blocks, ...end].join('');
};
