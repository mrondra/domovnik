import type { RequestContext } from '../../../kernel/src/context/index';

export interface InboundAttachment {
  readonly filename: string;
  readonly contentType: string;
  readonly body: Buffer;
}

/** One message as it arrived, whichever inbox it came out of. */
export interface InboundMail {
  readonly from: string;
  readonly subject: string;
  readonly text: string;
  readonly receivedAt: Date;
  readonly attachments: readonly InboundAttachment[];
}

/**
 * Where invoices arrive from (zadání kap. 8). The demo has a simulated inbox that is pushed to over
 * HTTP; an IMAP one that fetches for itself arrives in phase 3, and `poll` is the difference between
 * the two — everything after the message is the same path.
 */
export interface InboundMailAdapter {
  readonly kind: 'simulated' | 'imap';
  poll?(ctx: RequestContext): Promise<readonly InboundMail[]>;
}
