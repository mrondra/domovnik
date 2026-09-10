import { describe, expect, it } from 'vitest';
import { newId, newRowId, svjIdSchema, tenantIdSchema } from './index';

describe('branded ids', () => {
  it('mints a time-ordered uuid v7', () => {
    const first = newId(tenantIdSchema);
    const second = newId(tenantIdSchema);
    expect(first < second).toBe(true);
    expect(newRowId()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects a value that is not a uuid', () => {
    expect(() => tenantIdSchema.parse('nope')).toThrow(/TenantId/);
    expect(() => svjIdSchema.parse('nope')).toThrow(/SvjId/);
  });

  it('accepts an existing uuid for either brand', () => {
    const raw = newRowId();
    expect(tenantIdSchema.parse(raw)).toBe(raw);
    expect(svjIdSchema.parse(raw)).toBe(raw);
  });
});
