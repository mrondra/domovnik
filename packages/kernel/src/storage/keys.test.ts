import { describe, expect, it } from 'vitest';
import { createContext } from '../context/index';
import { newId, tenantIdSchema, userIdSchema } from '../ids/index';
import { assertKeyInTenant, storageKeyFor, storageKeySchema } from './keys';

const contextOf = (tenantId = newId(tenantIdSchema)) =>
  createContext({
    tenantId,
    actor: { type: 'user', id: newId(userIdSchema), roles: ['manager'] },
  });

describe('storageKeyFor', () => {
  it('puts the object under the tenant prefix and the owning area', () => {
    const ctx = contextOf();
    expect(storageKeyFor(ctx, 'documents', 'smlouva.pdf')).toMatch(
      new RegExp(`^tenants/${ctx.tenantId}/documents/[0-9a-f-]{36}\\.pdf$`),
    );
  });

  it('keeps the extension but never the uploaded name', () => {
    const key = storageKeyFor(contextOf(), 'documents', 'Faktura 2024 – ABC.PDF');
    expect(key).toMatch(/\.pdf$/);
    expect(key).not.toContain('Faktura');
  });

  it('gives a time-ordered name, so two uploads of one file do not collide', () => {
    const ctx = contextOf();
    const first = storageKeyFor(ctx, 'documents', 'faktura.pdf');
    const second = storageKeyFor(ctx, 'documents', 'faktura.pdf');
    expect(first).not.toBe(second);
    expect(first < second).toBe(true);
  });

  it('leaves a file without an extension without one', () => {
    expect(storageKeyFor(contextOf(), 'documents', 'README')).not.toContain('.');
  });

  it.each(['../secret.pdf', 'sub/dir.pdf', 'a\\b.pdf', '..'])('rejects the path %s', (filename) => {
    expect(() => storageKeyFor(contextOf(), 'documents', filename)).toThrow(
      /Název souboru nesmí obsahovat cestu/,
    );
  });

  it.each(['Documents', '../other', 'doc uments', ''])('rejects the area %s', (area) => {
    expect(() => storageKeyFor(contextOf(), area, 'faktura.pdf')).toThrow(
      /Oblast úložiště musí být název feature/,
    );
  });
});

describe('assertKeyInTenant', () => {
  it('accepts a key the same tenant made', () => {
    const ctx = contextOf();
    const key = storageKeyFor(ctx, 'documents', 'a.pdf');
    expect(() => {
      assertKeyInTenant(ctx, key);
    }).not.toThrow();
  });

  it('rejects a key of another tenant', () => {
    const foreign = storageKeyFor(contextOf(), 'documents', 'a.pdf');
    expect(() => {
      assertKeyInTenant(contextOf(), foreign);
    }).toThrow(/patří jinému tenantovi/);
  });

  it('rejects a key that only looks like a prefix', () => {
    const ctx = contextOf();
    const key = storageKeySchema.parse(`tenants/${ctx.tenantId}-other/documents/x.pdf`);
    expect(() => {
      assertKeyInTenant(ctx, key);
    }).toThrow(/patří jinému tenantovi/);
  });
});
