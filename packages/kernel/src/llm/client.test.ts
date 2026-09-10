import { afterEach, describe, expect, it } from 'vitest';
import { applyTestEnv } from '../testing/env';
import { anthropic, resetAnthropicClient } from './client';

afterEach(() => {
  resetAnthropicClient();
});

describe('anthropic client', () => {
  it('uses the public endpoint when no override is configured', () => {
    delete process.env['ANTHROPIC_BASE_URL'];
    applyTestEnv();
    resetAnthropicClient();
    expect(anthropic().baseURL).toContain('anthropic.com');
  });

  it('honours a configured base URL and reuses the instance', () => {
    applyTestEnv({ ANTHROPIC_BASE_URL: 'http://127.0.0.1:4242' });
    resetAnthropicClient();
    const client = anthropic();
    expect(client.baseURL).toBe('http://127.0.0.1:4242');
    expect(anthropic()).toBe(client);
  });
});
