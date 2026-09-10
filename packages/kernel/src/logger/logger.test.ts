import { describe, expect, it } from 'vitest';
import { createRootLogger } from './logger';
import { createLogger, logger, withLogger } from './index';

describe('logger', () => {
  it('redacts credentials and personal data', () => {
    const lines: string[] = [];
    createRootLogger({
      write: (chunk: string) => {
        lines.push(chunk);
      },
    })
      .child({ tenantId: 't1' })
      .error({ token: 'secret', user: { email: 'a@b.cz', phone: '+420' }, invoice: { total: 12 } }, 'zpráva');
    const output = lines.join('');

    expect(output).not.toContain('secret');
    expect(output).not.toContain('a@b.cz');
    expect(output).not.toContain('+420');
    expect(output).toContain('[redacted]');
    expect(output).toContain('t1');
    expect(output).toContain('12');
  });

  it('exposes the ambient logger inside withLogger', () => {
    const bound = createLogger({ correlationId: 'c' });
    expect(withLogger(bound, () => logger())).toBe(bound);
  });

  it('falls back to the root logger outside withLogger', () => {
    expect(logger()).toBeDefined();
  });
});
