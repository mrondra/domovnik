import { z } from 'zod';
import { clearTools, defineTool } from '../../../../packages/kernel/src/tools/index';

export const READ_TOOL = 'invoice.get';
export const PAY_TOOL = 'payment.createOrder';

/** One read-only tool and one that always needs a decision — the two cases a token has to tell apart. */
export const registerTools = (): void => {
  clearTools();
  defineTool({
    name: READ_TOOL,
    description: 'Vrátí fakturu podle id.',
    input: z.object({ invoiceId: z.uuid() }),
    output: z.object({ total: z.number() }),
    permission: 'finance.read',
    approval: () => ({ required: false, approvers: [] }),
    userComposable: true,
    readOnly: true,
    handler: () => Promise.resolve({ total: 1200 }),
  });

  defineTool({
    name: PAY_TOOL,
    description: 'Vytvoří příkaz k úhradě z účtu SVJ.',
    input: z.object({ amount: z.number() }),
    output: z.object({ orderId: z.string() }),
    permission: 'finance.pay',
    approval: () => ({ required: true, approvers: [] }),
    userComposable: false,
    readOnly: false,
    handler: () => Promise.resolve({ orderId: 'order-1' }),
  });
};

const textBlocks = z.object({ text: z.string() }).array().min(1);

const toolResult = z.object({ content: textBlocks });
const resourceResult = z.object({ contents: textBlocks });

/** Every answer is one JSON text block, so the assertions read the payload, not the envelope. */
export const payloadOf = (result: unknown): unknown =>
  JSON.parse(toolResult.parse(result).content[0]?.text ?? 'null');

export const resourcePayloadOf = (result: unknown): unknown =>
  JSON.parse(resourceResult.parse(result).contents[0]?.text ?? 'null');

/** A protocol-level refusal arrives as plain text, not as the JSON a handler would have produced. */
export const errorTextOf = (result: unknown): string => toolResult.parse(result).content[0]?.text ?? '';
