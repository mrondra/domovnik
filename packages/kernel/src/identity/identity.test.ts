import { beforeAll, describe, expect, it } from 'vitest';
import { newId, tenantIdSchema, userIdSchema } from '../ids/index';
import { applyTestEnv } from '../testing/env';
import { hasPermission, permissionsOf } from './permissions';
import { hashPassword, hashToken, newOpaqueToken, verifyPassword } from './secrets';
import { createSignedLink, verifySignedLink } from './signed-link';

beforeAll(() => {
  applyTestEnv();
});

const user = (roles: Parameters<typeof permissionsOf>[0]) =>
  ({ type: 'user', id: newId(userIdSchema), roles }) as const;

describe('permissions', () => {
  it('grants a tenant admin everything', () => {
    expect(hasPermission(user(['tenant_admin']), 'finance.pay')).toBe(true);
  });

  it('expands a domain wildcard but not across domains', () => {
    const finance = user(['finance']);
    expect(hasPermission(finance, 'finance.pay')).toBe(true);
    expect(hasPermission(finance, 'ops.inspection.close')).toBe(false);
  });

  it('grants an exact match without a wildcard', () => {
    expect(hasPermission(user(['technician']), 'tasks.update')).toBe(true);
    expect(hasPermission(user(['technician']), 'tasks.delete')).toBe(false);
  });

  it('combines the permissions of several roles', () => {
    const both = user(['finance', 'technician']);
    expect(hasPermission(both, 'finance.pay')).toBe(true);
    expect(hasPermission(both, 'field.report.submit')).toBe(true);
  });

  it('lets the system actor through', () => {
    expect(hasPermission({ type: 'system', id: null, roles: [] }, 'finance.pay')).toBe(true);
  });
});

describe('secrets', () => {
  it('verifies a password only against its own hash', async () => {
    const hash = await hashPassword('tajné-heslo');
    expect(hash).not.toContain('tajné-heslo');
    expect(await verifyPassword(hash, 'tajné-heslo')).toBe(true);
    expect(await verifyPassword(hash, 'jiné-heslo')).toBe(false);
  });

  it('hashes a bearer token deterministically', () => {
    const token = newOpaqueToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(newOpaqueToken())).not.toBe(hashToken(token));
  });
});

describe('signed links', () => {
  const subjectId = newId(userIdSchema);
  const addressee = { tenantId: newId(tenantIdSchema), actorId: newId(userIdSchema) };

  it('round-trips purpose and subject', () => {
    const token = createSignedLink({ purpose: 'approval.decide', subjectId, expiresIn: 60, ...addressee });
    const payload = verifySignedLink(token, 'approval.decide');
    expect(payload.subjectId).toBe(subjectId);
    expect(payload.actorId).toBe(addressee.actorId);
  });

  it('rejects a tampered payload', () => {
    const token = createSignedLink({ purpose: 'approval.decide', subjectId, expiresIn: 60, ...addressee });
    const [payload, signature] = token.split('.');
    const forged = `${Buffer.from(
      JSON.stringify({
        purpose: 'approval.decide',
        subjectId,
        expiresAt: 99_999_999_999,
        nonce: 'x',
        ...addressee,
      }),
    ).toString('base64url')}.${String(signature)}`;
    expect(payload).toBeDefined();
    expect(() => verifySignedLink(forged, 'approval.decide')).toThrow(/Neplatný podpis/);
  });

  it('rejects a link issued for another purpose', () => {
    const token = createSignedLink({ purpose: 'invoice.view', subjectId, expiresIn: 60, ...addressee });
    expect(() => verifySignedLink(token, 'approval.decide')).toThrow(/jiné akci/);
  });

  it('rejects an expired link', () => {
    const token = createSignedLink({ purpose: 'approval.decide', subjectId, expiresIn: -1, ...addressee });
    expect(() => verifySignedLink(token, 'approval.decide')).toThrow(/vypršel/);
  });

  it('rejects a malformed token', () => {
    expect(() => verifySignedLink('garbage', 'approval.decide')).toThrow(/Neplatný podpis/);
  });
});
