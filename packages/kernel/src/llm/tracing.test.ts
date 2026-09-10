import { afterEach, describe, expect, it } from 'vitest';
import { createContext } from '../context/index';
import { newId, svjIdSchema, tenantIdSchema, userIdSchema } from '../ids/index';
import { applyTestEnv } from '../testing/env';
import { resetTracing, startTrace } from './tracing';

const ctx = () =>
  createContext({
    tenantId: newId(tenantIdSchema),
    actor: { type: 'user', id: newId(userIdSchema), roles: ['finance'] },
    svjId: newId(svjIdSchema),
  });

afterEach(() => {
  resetTracing();
});

describe('startTrace', () => {
  it('is a no-op without Langfuse credentials', () => {
    for (const key of ['LANGFUSE_BASE_URL', 'LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY']) {
      Reflect.deleteProperty(process.env, key);
    }
    applyTestEnv();
    resetTracing();

    const context = ctx();
    const trace = startTrace(context, { name: 'llm.complete' });
    expect(trace.id).toBe(context.correlationId);

    const generation = trace.generation({ name: 'complete', model: 'claude-sonnet-5', input: {} });
    generation.end({ output: 'x', usage: { inputTokens: 1, outputTokens: 2 } });
    trace.end('x');
  });

  it('records a generation when Langfuse is configured', () => {
    applyTestEnv({
      LANGFUSE_BASE_URL: 'http://127.0.0.1:1',
      LANGFUSE_PUBLIC_KEY: 'pk',
      LANGFUSE_SECRET_KEY: 'sk',
    });
    resetTracing();

    const trace = startTrace(ctx(), { name: 'agent.invoice-processor', metadata: { autonomy: 'read' } });
    expect(trace.id).toMatch(/^[0-9a-f-]{36}$/);

    const generation = trace.generation({ name: 'turn', model: 'claude-sonnet-5', input: { a: 1 } });
    generation.end({ output: 'hotovo', usage: { inputTokens: 10, outputTokens: 3 } });
    trace.end('hotovo');
  });
});
