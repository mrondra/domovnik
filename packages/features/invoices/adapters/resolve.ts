import type { InboundMailAdapter } from './inbound-mail.adapter';
import { simulatedInboundMail } from './simulated-inbound-mail';

/**
 * The one place that names an implementation. Phase 1 has only the simulated inbox; the IMAP one
 * (phase 3) will be chosen per tenant here, and nothing that calls this will change.
 */
export const inboundMailAdapter = (): InboundMailAdapter => simulatedInboundMail;
