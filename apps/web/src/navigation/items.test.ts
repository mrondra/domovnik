import { describe, expect, it } from 'vitest';
import type { Session } from '../api/session';
import { hrefOf, navigationFor } from './items';

const sessionWith = (roles: Session['roles']): Session => ({
  tenantId: '00000000-0000-7000-8000-000000000001',
  userId: '00000000-0000-7000-8000-000000000002',
  roles,
  svjId: null,
  credential: 'session',
});

const labels = (roles: Session['roles'], svjId: string | null): readonly string[] =>
  navigationFor(sessionWith(roles), svjId).map((item) => item.label);

describe('navigationFor', () => {
  it('keeps tenant-only items out of the view inside one SVJ', () => {
    expect(labels(['manager'], 'svj-1')).not.toContain('Nastavení');
    expect(labels(['manager'], null)).toContain('Nastavení');
  });

  it('offers the approvals inbox in both views', () => {
    expect(labels(['committee'], null)).toContain('Schvalování');
    expect(labels(['committee'], 'svj-1')).toContain('Schvalování');
  });

  it('orders items by their declared order, lowest first', () => {
    expect(labels(['tenant_admin'], null)[0]).toBe('Přehled');
  });
});

describe('hrefOf', () => {
  const overview = { href: '', label: 'Přehled', scope: 'both', order: 0 } as const;
  const approvals = { href: 'approvals', label: 'Schvalování', scope: 'both', order: 10 } as const;

  it('prefixes an item with the chosen SVJ', () => {
    expect(hrefOf(approvals, 'svj-1')).toBe('/s/svj-1/approvals');
    expect(hrefOf(overview, 'svj-1')).toBe('/s/svj-1');
  });

  it('leaves the cross-SVJ view unprefixed', () => {
    expect(hrefOf(approvals, null)).toBe('/approvals');
    expect(hrefOf(overview, null)).toBe('/');
  });
});
