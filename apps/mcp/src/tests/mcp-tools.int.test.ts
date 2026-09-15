import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { connect, startHarness, toolNames } from './mcp.fixture';
import type { McpHarness } from './mcp.fixture';
import { errorTextOf, payloadOf } from './tools.fixture';

const INVOICE_ID = '8f14e45f-ceea-467a-9f30-1b0e0b0e0001';

const pendingApproval = z.object({ status: z.literal('pending_approval'), approvalId: z.uuid() });

let mcp: McpHarness;

beforeAll(async () => {
  mcp = await startHarness();
}, 180_000);

afterAll(async () => {
  await mcp.stop();
});

describe('what a token exposes', () => {
  it('lists only the tools the token names', async () => {
    const client = await connect(mcp.url, mcp.readOnly.token);

    expect(await toolNames(client)).toEqual(['invoice_get']);

    await client.close();
  });

  it('lists every tool of a wider token', async () => {
    const client = await connect(mcp.url, mcp.full.token);

    expect(await toolNames(client)).toEqual(expect.arrayContaining(['invoice_get', 'payment_createOrder']));

    await client.close();
  });

  it('refuses a call to a tool outside the token', async () => {
    const client = await connect(mcp.url, mcp.readOnly.token);

    const result = await client.callTool({ name: 'payment_createOrder', arguments: { amount: 10 } });

    // Not "forbidden" but "unknown": a tool outside the token does not exist for this connection.
    expect(result).toMatchObject({ isError: true });
    expect(errorTextOf(result)).toContain('not found');

    await client.close();
  });
});

describe('calling a tool', () => {
  it('returns the output of a tool that needs no decision', async () => {
    const client = await connect(mcp.url, mcp.readOnly.token);

    const result = await client.callTool({ name: 'invoice_get', arguments: { invoiceId: INVOICE_ID } });

    expect(payloadOf(result)).toEqual({ status: 'ok', output: { total: 1200 } });
    await client.close();
  });

  it('answers pending_approval instead of acting when the policy requires a decision', async () => {
    const client = await connect(mcp.url, mcp.full.token);

    const result = await client.callTool({ name: 'payment_createOrder', arguments: { amount: 4200 } });

    expect(pendingApproval.safeParse(payloadOf(result)).success).toBe(true);
    await client.close();
  });
});
