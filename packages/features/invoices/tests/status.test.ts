import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../kernel/src/errors/index';
import { TRANSITIONS, assertTransition, type InvoiceStatus } from '../domain/status';

const ALL = Object.keys(TRANSITIONS) as readonly InvoiceStatus[];

const allowed: readonly (readonly [InvoiceStatus, InvoiceStatus])[] = ALL.flatMap((from) =>
  TRANSITIONS[from].map((to) => [from, to] as const),
);

const refused: readonly (readonly [InvoiceStatus, InvoiceStatus])[] = ALL.flatMap((from) =>
  ALL.filter((to) => !TRANSITIONS[from].includes(to)).map((to) => [from, to] as const),
);

describe('the invoice state machine', () => {
  it.each(allowed)('lets an invoice go from %s to %s', (from, to) => {
    expect(() => {
      assertTransition(from, to);
    }).not.toThrow();
  });

  it.each(refused)('refuses %s to %s', (from, to) => {
    expect(() => {
      assertTransition(from, to);
    }).toThrow(DomainError);
  });

  it('names the rule it broke, so a caller can tell why', () => {
    expect(() => {
      assertTransition('paid', 'received');
    }).toThrow(expect.objectContaining({ code: 'invoice_transition_invalid' }));
  });

  it('leaves rejected and paid with nowhere to go', () => {
    expect(TRANSITIONS.rejected).toStrictEqual([]);
    expect(TRANSITIONS.paid).toStrictEqual([]);
  });
});
