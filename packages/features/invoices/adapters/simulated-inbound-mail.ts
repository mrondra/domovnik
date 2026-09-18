import type { InboundMailAdapter } from './inbound-mail.adapter';

/**
 * The demo inbox. It has no `poll`, because nothing fetches from it: a message arrives by being
 * posted to `POST /svj/:svjId/invoices/inbound`, which is the simulation. What the message is put
 * through afterwards is what a real IMAP message would be put through (task 015).
 */
export const simulatedInboundMail: InboundMailAdapter = { kind: 'simulated' };
