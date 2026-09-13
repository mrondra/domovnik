import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { UnauthenticatedError } from '../errors/index';
import { tenantIdSchema, userIdSchema, type TenantId, type UserId } from '../ids/index';
import { isSignatureValid, signPayload } from './secrets';

const signedLinkPayloadSchema = z.object({
  purpose: z.string().min(1),
  tenantId: tenantIdSchema,
  actorId: userIdSchema,
  subjectId: z.uuid(),
  expiresAt: z.number().int().positive(),
  nonce: z.string().min(1),
});

export type SignedLinkPayload = z.infer<typeof signedLinkPayloadSchema>;

export interface CreateSignedLinkInput {
  readonly purpose: string;
  /** The link stands in for one named person in one tenant, so a context can be built from it. */
  readonly tenantId: TenantId;
  readonly actorId: UserId;
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
    tenantId: input.tenantId,
    actorId: input.actorId,
    subjectId: input.subjectId,
    expiresAt: Math.floor(Date.now() / MILLIS_PER_SECOND) + input.expiresIn,
    nonce: randomBytes(NONCE_BYTES).toString('base64url'),
  };
  const encoded = encode(payload);
  return `${encoded}.${signPayload(encoded)}`;
};

const decode = (encoded: string): SignedLinkPayload => {
  const parsed = signedLinkPayloadSchema.safeParse(JSON.parse(Buffer.from(encoded, 'base64url').toString()));
  if (!parsed.success) {
    throw new UnauthenticatedError('Neplatný obsah odkazu', { code: 'signed_link_invalid' });
  }
  return parsed.data;
};

export const verifySignedLink = (token: string, purpose: string): SignedLinkPayload => {
  const [encoded, signature] = token.split('.');
  if (encoded === undefined || signature === undefined || !isSignatureValid(encoded, signature)) {
    throw new UnauthenticatedError('Neplatný podpis odkazu', { code: 'signed_link_invalid' });
  }

  const payload = decode(encoded);
  if (payload.purpose !== purpose) {
    throw new UnauthenticatedError('Odkaz patří k jiné akci', { code: 'signed_link_purpose_mismatch' });
  }
  if (payload.expiresAt * MILLIS_PER_SECOND < Date.now()) {
    throw new UnauthenticatedError('Odkaz vypršel', { code: 'signed_link_expired' });
  }

  return payload;
};
