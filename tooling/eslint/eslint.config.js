// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import layers from './layers.js';
import practices from './practices.js';
import overrides from './overrides.js';

export default defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/.next/**',
    // Written by `next build`, down to the triple-slash references it points at `.next`.
    '**/next-env.d.ts',
    '**/node_modules/**',
    '**/drizzle/**',
  ]),
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  { languageOptions: { parserOptions: { projectService: true } } },
  layers,
  practices,
  overrides,
);
