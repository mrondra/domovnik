import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { clearTools, defineTool, getTools, requireTool } from '../tools/registry/index';
import { assertAutonomyAllows, toolsForAutonomy } from './autonomy';
import { clearAgents } from './definition';

const noApproval = { required: false, approvers: [] } as const;
const withApproval = { required: true, approvers: ['someone'] } as const;

beforeEach(() => {
  clearTools();
  clearAgents();
  defineTool({
    name: 'invoice.get',
    description: 'Vrátí fakturu.',
    input: z.object({ invoiceId: z.string() }),
    output: z.object({ total: z.number() }),
    permission: 'finance.read',
    approval: () => noApproval,
    userComposable: true,
    readOnly: true,
    handler: () => Promise.resolve({ total: 1 }),
  });
  defineTool({
    name: 'payment.createOrder',
    description: 'Vytvoří příkaz k úhradě.',
    input: z.object({ amount: z.number() }),
    output: z.object({ orderId: z.string() }),
    permission: 'finance.pay',
    approval: () => withApproval,
    userComposable: false,
    readOnly: false,
    handler: () => Promise.resolve({ orderId: 'o1' }),
  });
  defineTool({
    name: 'invoice.draftReply',
    description: 'Připraví návrh odpovědi.',
    input: z.object({ text: z.string() }),
    output: z.object({ draftId: z.string() }),
    permission: 'finance.read',
    approval: () => noApproval,
    userComposable: true,
    readOnly: false,
    proposal: true,
    handler: () => Promise.resolve({ draftId: 'd1' }),
  });
});

const allTools = () => getTools({ actor: { type: 'system', id: null, roles: [] } });

describe('autonomy', () => {
  it('shows a read-only agent nothing with side effects', () => {
    expect(toolsForAutonomy(allTools(), 'read').map((tool) => tool.name)).toEqual(['invoice.get']);
  });

  it('leaves the tool list intact for propose and act', () => {
    expect(toolsForAutonomy(allTools(), 'propose')).toHaveLength(3);
    expect(toolsForAutonomy(allTools(), 'act')).toHaveLength(3);
  });

  it('refuses a side-effect call from a read-only agent', () => {
    expect(() => {
      assertAutonomyAllows('read', requireTool('payment.createOrder'), withApproval);
    }).toThrow(/autonomií read/);
  });

  it('lets a proposing agent act only through approval or a draft', () => {
    expect(() => {
      assertAutonomyAllows('propose', requireTool('payment.createOrder'), withApproval);
    }).not.toThrow();
    expect(() => {
      assertAutonomyAllows('propose', requireTool('invoice.draftReply'), noApproval);
    }).not.toThrow();
    expect(() => {
      assertAutonomyAllows('propose', requireTool('payment.createOrder'), noApproval);
    }).toThrow(/bez schválení/);
  });

  it('lets an acting agent through', () => {
    expect(() => {
      assertAutonomyAllows('act', requireTool('payment.createOrder'), noApproval);
    }).not.toThrow();
  });
});
