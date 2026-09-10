import { symbolOf, toolName, type ToolInput } from './tool-names';

const policy = (input: ToolInput): string =>
  input.requiresApproval
    ? `  /** A tool with \`required: true\` never reaches its handler directly (ADR 0006). */
  approval: () => ({ required: true, approvers: ['tenant_admin'] }),
  userComposable: false,
  readOnly: false,`
    : `  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,`;

export const toolTs = (input: ToolInput): string => {
  const imported = input.requiresApproval ? 'defineTool' : 'defineTool, neverRequiresApproval';

  return `import { z } from 'zod';
import { ${imported} } from '../../../kernel/src/tools/index';

/**
 * Defining the tool registers it; \`loadToolsFrom\` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6). The description is written for the model: what it does, when to use it,
 * what it returns.
 */
export const ${symbolOf(input)} = defineTool({
  name: '${toolName(input)}',
  description: 'Doplň: co tool dělá, kdy ho model má použít a co vrací.',
  input: z.object({ recordId: z.uuid() }),
  output: z.object({ ok: z.boolean() }),
  permission: '${input.feature.camel}.${input.requiresApproval ? 'write' : 'read'}',
${policy(input)}
  // Replace the body with a call to the feature's service; a tool never touches the database itself.
  handler: (_ctx, input) => Promise.resolve({ ok: input.recordId.length > 0 }),
});
`;
};
