import { ForbiddenError } from '../errors/index';
import type { RegisteredTool } from '../tools/registry/index';
import type { ApprovalPolicy } from '../tools/definition';
import type { Autonomy } from './definition';

/**
 * Static half of the autonomy limit: which tools the model gets to see at all. `propose` cannot be
 * decided statically, because whether a tool requires approval depends on the input.
 */
export const toolsForAutonomy = (
  tools: readonly RegisteredTool[],
  autonomy: Autonomy,
): readonly RegisteredTool[] => (autonomy === 'read' ? tools.filter((tool) => tool.readOnly) : tools);

/** Dynamic half: a `propose` agent may only call something that leaves a proposal behind. */
export const assertAutonomyAllows = (
  autonomy: Autonomy,
  tool: RegisteredTool,
  policy: ApprovalPolicy,
): void => {
  if (autonomy === 'act') return;

  if (autonomy === 'read' && !tool.readOnly) {
    throw new ForbiddenError(`Agent s autonomií read nesmí volat ${tool.name}`, {
      code: 'autonomy_read_only',
      details: { tool: tool.name },
    });
  }

  if (autonomy === 'propose' && !tool.readOnly && !tool.proposal && !policy.required) {
    throw new ForbiddenError(`Agent s autonomií propose nesmí volat ${tool.name} bez schválení`, {
      code: 'autonomy_propose_only',
      details: { tool: tool.name },
    });
  }
};
