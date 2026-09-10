import type { GeneratedFile } from '../lib/files';
import { featurePath } from '../lib/repo';
import { toolTs } from './tool-source';
import { toolApprovalIntTest, toolTest } from './tool-tests';
import type { ToolInput } from './tool-names';

export const toolFiles = (input: ToolInput): readonly GeneratedFile[] => {
  const at = (relative: string): string => `${featurePath(input.feature.kebab)}/${relative}`;
  const files = [
    { path: at(`tools/${input.tool.kebab}.ts`), contents: toolTs(input) },
    { path: at(`tests/${input.tool.kebab}.tool.test.ts`), contents: toolTest(input) },
  ];

  if (!input.requiresApproval) return files;
  return [
    ...files,
    { path: at(`tests/${input.tool.kebab}.tool.int.test.ts`), contents: toolApprovalIntTest(input) },
  ];
};
