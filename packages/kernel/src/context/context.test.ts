import { describe, expect, it } from 'vitest';
import { newId, tenantIdSchema, userIdSchema, svjIdSchema, agentRunIdSchema } from '../ids/index';
import { createContext, currentContext, runInContext, withAgentRun, withCorrelation, withSvj } from './index';

const anyContext = () =>
  createContext({
    tenantId: newId(tenantIdSchema),
    actor: { type: 'user', id: newId(userIdSchema), roles: ['manager'] },
  });

describe('RequestContext', () => {
  it('generates a correlation id when none is given', () => {
    expect(anyContext().correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('derives a new context without mutating the original', () => {
    const base = anyContext();
    const svjId = newId(svjIdSchema);
    const agentRunId = newId(agentRunIdSchema);

    expect(withCorrelation(base, 'corr').correlationId).toBe('corr');
    expect(withSvj(base, svjId).svjId).toBe(svjId);
    expect(withAgentRun(base, agentRunId).agentRunId).toBe(agentRunId);
    expect(base.svjId).toBeUndefined();
  });

  it('makes the context ambient for nested code', () => {
    const base = anyContext();
    expect(currentContext()).toBeUndefined();
    expect(runInContext(base, () => currentContext())).toBe(base);
  });
});
