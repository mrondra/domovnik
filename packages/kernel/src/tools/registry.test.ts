import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createContext, type Actor } from '../context/index';
import { newId, tenantIdSchema, userIdSchema } from '../ids/index';
import { clearTools, defineTool, getTools, requireTool, runToolHandler } from './registry/index';

const actor = (roles: Actor['roles']): Actor => ({
  type: 'user',
  id: newId(userIdSchema),
  roles,
});

const ctx = () => createContext({ tenantId: newId(tenantIdSchema), actor: actor(['tenant_admin']) });

beforeEach(() => {
  clearTools();
  defineTool({
    name: 'invoice.get',
    description: 'Vrátí fakturu.',
    input: z.object({ invoiceId: z.string() }),
    output: z.object({ total: z.number() }),
    permission: 'finance.read',
    approval: () => ({ required: false, approvers: [] }),
    userComposable: true,
    readOnly: true,
    handler: () => Promise.resolve({ total: 10 }),
  });
  defineTool({
    name: 'ops.task.create',
    description: 'Založí úkol.',
    input: z.object({ title: z.string() }),
    output: z.object({ taskId: z.string() }),
    permission: 'tasks.create',
    approval: () => ({ required: false, approvers: [] }),
    userComposable: true,
    readOnly: false,
    handler: () => Promise.resolve({ taskId: 't1' }),
  });
});

describe('tool registry', () => {
  it('registers a tool as a side effect of defining it', () => {
    expect(requireTool('invoice.get').name).toBe('invoice.get');
  });

  it('reports an unknown tool instead of returning undefined', () => {
    expect(() => requireTool('nope')).toThrow(/není v registru/);
  });

  it('filters by name and by the actor permissions', () => {
    expect(getTools({ actor: actor(['tenant_admin']) }).map((tool) => tool.name)).toEqual([
      'invoice.get',
      'ops.task.create',
    ]);
    expect(getTools({ actor: actor(['finance']) }).map((tool) => tool.name)).toEqual(['invoice.get']);
    expect(
      getTools({ names: ['ops.task.create'], actor: actor(['tenant_admin']) }).map((tool) => tool.name),
    ).toEqual(['ops.task.create']);
  });

  it('defaults proposal to false', () => {
    expect(requireTool('invoice.get').proposal).toBe(false);
  });

  it('rejects a handler result that breaks the output schema', async () => {
    defineTool({
      name: 'broken.tool',
      description: 'Vrátí nesmysl.',
      input: z.object({}),
      output: z.object({ total: z.number() }),
      permission: 'finance.read',
      approval: () => ({ required: false, approvers: [] }),
      userComposable: false,
      readOnly: true,
      handler: () => Promise.resolve({ total: 'nope' } as never),
    });

    await expect(runToolHandler(ctx(), requireTool('broken.tool'), {})).rejects.toThrow(/Neplatný výstup/);
  });

  it('rejects input that breaks the input schema before the handler runs', async () => {
    await expect(runToolHandler(ctx(), requireTool('invoice.get'), { invoiceId: 1 })).rejects.toThrow(
      /Neplatný vstup/,
    );
  });
});
