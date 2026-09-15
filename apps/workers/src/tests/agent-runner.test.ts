import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTestEnv } from '../../../../packages/kernel/src/testing/index';
import { agentDefinition, agentRunFor, peakTracker, runAgentMock, tenantContext } from './agent.fixture';

vi.mock('../../../../packages/kernel/src/agents/index', async () => {
  const actual = await vi.importActual('../../../../packages/kernel/src/agents/index');
  return { ...actual, runAgent: runAgentMock };
});

const { createAgentRunner } = await import('../runtime/agent-runner');

beforeEach(() => {
  runAgentMock.mockReset();
});

describe('the agent runner', () => {
  it('never runs one agent more times in parallel than its limit', async () => {
    applyTestEnv({ AGENT_MAX_CONCURRENCY: '2', AGENT_TENANT_MAX_CONCURRENCY: '9' });
    const peak = peakTracker();
    runAgentMock.mockImplementation(() => peak.run());

    const runner = createAgentRunner();
    const ctx = tenantContext('11111111-1111-7111-8111-111111111111');
    const definition = agentDefinition('invoice-processor');

    await Promise.all(Array.from({ length: 10 }, () => runner(ctx, definition, agentRunFor('event-1'))));

    expect(runAgentMock).toHaveBeenCalledTimes(10);
    expect(peak.highest()).toBe(2);
  });

  it('never runs one tenant more times in parallel than its limit, across agents', async () => {
    applyTestEnv({ AGENT_MAX_CONCURRENCY: '9', AGENT_TENANT_MAX_CONCURRENCY: '2' });
    const peak = peakTracker();
    runAgentMock.mockImplementation(() => peak.run());

    const runner = createAgentRunner();
    const ctx = tenantContext('22222222-2222-7222-8222-222222222222');

    await Promise.all(
      Array.from({ length: 10 }, (_unused, index) =>
        runner(ctx, agentDefinition(`agent-${String(index)}`), agentRunFor('event-2')),
      ),
    );

    expect(peak.highest()).toBe(2);
  });

  it('treats an agent switched off for the tenant as nothing to do', async () => {
    applyTestEnv({ AGENT_MAX_CONCURRENCY: '2', AGENT_TENANT_MAX_CONCURRENCY: '2' });
    const { DomainError } = await import('../../../../packages/kernel/src/errors/index');
    runAgentMock.mockRejectedValue(new DomainError('vypnutý', { code: 'agent_disabled' }));

    const runner = createAgentRunner();
    const ctx = tenantContext('33333333-3333-7333-8333-333333333333');

    await expect(runner(ctx, agentDefinition('quiet'), agentRunFor('event-3'))).resolves.toBeUndefined();
  });

  it('lets a real failure fail the delivery, so the queue retries it', async () => {
    applyTestEnv({ AGENT_MAX_CONCURRENCY: '2', AGENT_TENANT_MAX_CONCURRENCY: '2' });
    runAgentMock.mockRejectedValue(new TypeError('databáze nedostupná'));

    const runner = createAgentRunner();
    const ctx = tenantContext('44444444-4444-7444-8444-444444444444');

    await expect(runner(ctx, agentDefinition('noisy'), agentRunFor('event-4'))).rejects.toThrow(
      'databáze nedostupná',
    );
  });
});
