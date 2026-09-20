import { sampleInvoicePdf } from './sample-invoice.fixture';
import type { InvoiceScenario } from './invoice-text.fixture';

/**
 * The PDF of a scenario. It is built rather than committed, and it has to come out byte-for-byte
 * the same every time: the LLM replay fixture is keyed by the prompt, and the prompt carries the
 * text of this file (task 016).
 */
export const scenarioPdf = (scenario: InvoiceScenario): Promise<Buffer> => sampleInvoicePdf(scenario.lines);
