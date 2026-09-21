import { z } from 'zod';

const block = z.object({
  type: z.string().optional(),
  text: z.string().optional(),
  name: z.string().optional(),
});

const message = z.object({ content: z.union([z.string(), z.array(block)]).optional() });

const requestBody = z.object({ messages: z.array(message).optional() });

type Block = z.output<typeof block>;
type Message = z.output<typeof message>;

/** A request the model would get, or something else entirely — a probe is not worth crashing on. */
const messagesOf = (body: string): readonly Message[] => {
  try {
    return requestBody.parse(JSON.parse(body)).messages ?? [];
  } catch {
    return [];
  }
};

const blocksOf = (one: Message): readonly Block[] => (Array.isArray(one.content) ? one.content : []);

/**
 * What the conversation says so far, decoded. The request body is JSON, so reading the transcript
 * out of it beats matching patterns against escaped text (task 026).
 */
export const transcriptOf = (body: string): string =>
  messagesOf(body)
    .flatMap((one) =>
      typeof one.content === 'string' ? [one.content] : blocksOf(one).map((part) => part.text ?? ''),
    )
    .join('\n');

/** Which of its tools the agent has already called; the stub answers with the next step. */
export const toolsCalled = (body: string): readonly string[] =>
  messagesOf(body)
    .flatMap(blocksOf)
    .filter((part) => part.type === 'tool_use')
    .map((part) => part.name ?? '');

/** The uuid a trigger payload carries; it is different in every run, so it is read, not recorded. */
export const idOf = (body: string, field: string): string =>
  new RegExp(`"${field}"\\s*:\\s*"([0-9a-f-]{36})"`, 'u').exec(transcriptOf(body))?.[1] ?? '';
