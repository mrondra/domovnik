import { format, resolveConfig } from 'prettier';

const FORMATTABLE = new Set(['.ts', '.tsx', '.js', '.json', '.md']);

/**
 * Generated files go through the repository's own Prettier config, so `pnpm verify` is green right
 * after a generator ran and templates do not have to be hand-wrapped to 110 columns.
 */
export const formatSource = async (absolutePath: string, contents: string): Promise<string> => {
  const extension = absolutePath.slice(absolutePath.lastIndexOf('.'));
  if (!FORMATTABLE.has(extension)) return contents;
  const options = await resolveConfig(absolutePath);
  return format(contents, { ...options, filepath: absolutePath });
};
