import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { AdapterError } from '../../../../../kernel/src/errors/index';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  removeNSPrefix: true,
  parseTagValue: false,
});

const itemSchema = z.object({
  '@state': z.string().optional(),
  '@id': z.string().optional(),
  '@note': z.string().optional(),
  producedDetails: z.object({ id: z.string().optional(), number: z.string().optional() }).optional(),
  importDetails: z.unknown().optional(),
});

const packSchema = z.object({
  responsePack: z.object({
    '@state': z.string().optional(),
    responsePackItem: z.union([itemSchema, z.array(itemSchema)]),
  }),
});

export interface PohodaResult {
  readonly ok: boolean;
  /** Pohoda's own id for the document it created, which is what `accountingRef` becomes. */
  readonly id: string | null;
  readonly number: string | null;
  readonly message: string | null;
}

/**
 * What Pohoda answers a `dataPack` with. An `error` state is not an exception here — it is an
 * answer, and the caller decides whether a rejected invoice is worth retrying (ADR 0005).
 */
export const parseResponsePack = (xml: string): PohodaResult => {
  const parsed = packSchema.safeParse(parser.parse(xml));
  if (!parsed.success) {
    throw new AdapterError('Pohoda odpověděla v nečekaném tvaru', {
      code: 'pohoda_response_unreadable',
      retryable: false,
      details: { issues: parsed.error.issues.slice(0, 3) },
    });
  }

  const pack = parsed.data.responsePack;
  const items = Array.isArray(pack.responsePackItem) ? pack.responsePackItem : [pack.responsePackItem];
  const first = items[0];

  return {
    ok: (pack['@state'] ?? first?.['@state']) === 'ok',
    id: first?.producedDetails?.id ?? first?.['@id'] ?? null,
    number: first?.producedDetails?.number ?? null,
    message: first?.['@note'] ?? null,
  };
};
