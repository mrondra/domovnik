import { ValidationError } from '../../../kernel/src/errors/index';
import type { InboundAttachment, InboundMail } from '../adapters/index';

/**
 * The shape `@fastify/multipart` adds to a request, named here rather than imported: a feature may
 * not depend on an app, and the two methods this endpoint uses are the whole of what it needs.
 */
interface MultipartField {
  readonly type: 'field' | 'file';
  readonly fieldname: string;
  readonly value?: unknown;
  readonly filename?: string;
  readonly mimetype?: string;
  toBuffer?(): Promise<Buffer>;
}

export interface MultipartRequest {
  isMultipart?(): boolean;
  parts(): AsyncIterableIterator<MultipartField>;
}

const TEXT_FIELDS = ['from', 'subject', 'body'] as const;

const notMultipart = (): ValidationError =>
  new ValidationError('Očekává se multipart/form-data s přílohou', {
    code: 'inbound_not_multipart',
  });

/**
 * Reads the whole message in one pass. Fastify streams the parts in the order the client wrote
 * them, so a file may arrive before the fields describing it — which is why nothing is decided
 * until the last part has been read.
 */
export const readInboundMail = async (request: MultipartRequest, receivedAt: Date): Promise<InboundMail> => {
  if (request.isMultipart?.() === false) throw notMultipart();

  const fields = new Map<string, string>();
  const attachments: InboundAttachment[] = [];

  for await (const part of request.parts()) {
    if (part.type === 'file' && part.toBuffer !== undefined) {
      attachments.push({
        filename: part.filename ?? 'priloha',
        contentType: part.mimetype ?? 'application/octet-stream',
        body: await part.toBuffer(),
      });
      continue;
    }
    if (typeof part.value === 'string') fields.set(part.fieldname, part.value);
  }

  for (const name of TEXT_FIELDS) {
    if (fields.get(name) === undefined) {
      throw new ValidationError(`Chybí pole ${name}`, {
        code: 'inbound_field_missing',
        details: { field: name },
      });
    }
  }

  return {
    from: fields.get('from') ?? '',
    subject: fields.get('subject') ?? '',
    text: fields.get('body') ?? '',
    receivedAt,
    attachments,
  };
};
