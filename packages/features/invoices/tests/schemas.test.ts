import { describe, expect, it } from 'vitest';
import { contractSchema } from '../../suppliers/index';
import { budgetCategorySchema } from '../domain/schemas';

describe('budgetCategorySchema', () => {
  it('stays the same set of values as suppliers keeps on Contract (ADR 0023) — this copy exists only so the UI build never pulls in the Nest module behind suppliers/index (task 029 review round 3)', () => {
    expect(budgetCategorySchema.options).toStrictEqual(contractSchema.shape.budgetCategory.options);
  });
});
