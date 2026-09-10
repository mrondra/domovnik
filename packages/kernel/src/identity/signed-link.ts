import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { ForbiddenError } from '../errors/index';
import { isSignatureValid, signPayload } from './secrets';

const signedLinkPayloadSchema = z.object({
  purpose: z.string().min(1),
  subjectId: z.uuid(),
  expiresAt: z.number().int().positive(),
  nonce: z.string().min(1),
});

export type SignedLinkPayload = z.infer<typeof signedLinkPayloadSchema>;

export interface CreateSignedLinkInput {
  readonly purpose: string;
  readonly subjectId: string;
  /** Seconds. */
  readonly expiresIn: number;
}

const MILLIS_PER_SECOND = 1000;
const NONCE_BYTES = 12;

const encode = (payload: SignedLinkPayload): string =>
  Buffer.from(JSON.stringify(payload)).toString('base64url');

/**
 * Stateless signed link used for approving from e-mail. Single use is enforced by the target
 * entity's own state transition (an approval leaves `pending` exactly once), not by the token.
 */
export const createSignedLink = (input: CreateSignedLinkInput): string => {
  const payload: SignedLinkPayload = {
    purpose: input.purpose,
    subjectId: input.subjectId,
    expiresAt: Math.floor(Date.now() / MILLIS_PER_SECOND) + input.expiresIn,
    nonce: randomBytes(NONCE_BYTES).toString('base64url'),
  };
  const encoded = encode(payload);
  return `${encoded}.${signPayload(encoded)}`;
};

export const verifySignedLink = (token: string, purpose: string): SignedLinkPayload => {
  const [encoded, signature] = token.split('.');
  if (encoded === undefined || signature === undefined || !isSignatureValid(encoded, signature)) {
    throw new ForbiddenError('Neplatný podpis odkazu', { code: 'signed_link_invalid' });
  }

  const parsed = signedLinkPayloadSchema.safeParse(JSON.parse(Buffer.from(encoded, 'base64url').toString()));
  if (!parsed.success) {
    throw new ForbiddenError('Neplatný obsah odkazu', { code: 'signed_link_invalid' });
  }
  if (parsed.data.purpose !== purpose) {
    throw new ForbiddenError('Odkaz patří k jiné akci', { code: 'signed_link_purpose_mismatch' });
  }
  if (parsed.data.expiresAt * MILLIS_PER_SECOND < Date.now()) {
    throw new ForbiddenError('Odkaz vypršel', { code: 'signed_link_expired' });
  }

  return parsed.data;
};
