import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import { loadEnv } from '../env/index';

const TOKEN_BYTES = 32;

export const hashPassword = (password: string): Promise<string> => argon2Hash(password);

export const verifyPassword = async (hash: string, password: string): Promise<boolean> =>
  argon2Verify(hash, password);

/** Opaque bearer token. Only its HMAC is stored, so a database dump cannot be replayed. */
export const newOpaqueToken = (): string => randomBytes(TOKEN_BYTES).toString('base64url');

export const hashToken = (token: string): string =>
  createHmac('sha256', loadEnv().APP_SECRET).update(token).digest('base64url');

export const signPayload = (payload: string): string =>
  createHmac('sha256', loadEnv().APP_SECRET).update(payload).digest('base64url');

export const isSignatureValid = (payload: string, signature: string): boolean => {
  const expected = Buffer.from(signPayload(payload));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
