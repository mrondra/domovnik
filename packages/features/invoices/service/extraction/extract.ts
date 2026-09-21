import type { RequestContext } from '../../../../kernel/src/context/index';
import { llm } from '../../../../kernel/src/llm/index';
import { EXTRACTION_PROMPT } from './prompt';
import { extractedInvoiceSchema, type ExtractedInvoice } from './schema';

/**
 * One call for the whole invoice, lines included. Asking per line would be a model call in a loop —
 * slower, dearer and worse, because a line only makes sense next to the rest of the document
 * (AGENTS.md §7, lint rule `no-llm-in-loop`).
 */
export const extractInvoice = async (ctx: RequestContext, text: string): Promise<ExtractedInvoice> => {
  const result = await llm.extract(ctx, extractedInvoiceSchema, {
    model: 'haiku',
    prompt: `${EXTRACTION_PROMPT}\n\n${text}`,
  });

  return result.value;
};
