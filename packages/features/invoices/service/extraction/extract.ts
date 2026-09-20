import { promptFromFile } from '../../../../kernel/src/agents/index';
import type { RequestContext } from '../../../../kernel/src/context/index';
import { llm } from '../../../../kernel/src/llm/index';
import { extractedInvoiceSchema, type ExtractedInvoice } from './schema';

/** The prompt lives next to the code that sends it, in Czech, because a person reviews it. */
const PROMPT = promptFromFile(new URL('./prompt.md', import.meta.url));

/**
 * One call for the whole invoice, lines included. Asking per line would be a model call in a loop —
 * slower, dearer and worse, because a line only makes sense next to the rest of the document
 * (AGENTS.md §7, lint rule `no-llm-in-loop`).
 */
export const extractInvoice = async (ctx: RequestContext, text: string): Promise<ExtractedInvoice> => {
  const result = await llm.extract(ctx, extractedInvoiceSchema, {
    model: 'haiku',
    prompt: `${PROMPT}\n\n${text}`,
  });

  return result.value;
};
