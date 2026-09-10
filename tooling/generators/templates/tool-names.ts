import type { Names } from '../lib/names';

export interface ToolInput {
  readonly feature: Names;
  readonly tool: Names;
  readonly requiresApproval: boolean;
}

/** `demo` + `ping` → the exported symbol `demoPing` and the tool name `demo.ping`. */
export const symbolOf = (input: ToolInput): string => `${input.feature.camel}${input.tool.pascal}`;

export const toolName = (input: ToolInput): string => `${input.feature.camel}.${input.tool.camel}`;
