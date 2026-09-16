/**
 * The TypeScript parser adds nodes the ESTree types behind the ESLint rule API do not describe:
 * `export const x = { … } as const` arrives as a `TSAsExpression` wrapping the object literal.
 * @typedef {{ type: 'TSAsExpression', expression: import('estree').Expression }} TSAsExpression
 */

/** @param {import('estree').Expression | TSAsExpression | null | undefined} node */
const isObjectLiteral = (node) => {
  const unwrapped = node?.type === 'TSAsExpression' ? node.expression : node;
  return unwrapped?.type === 'ObjectExpression';
};

/**
 * An `index.ts` is the public face of a directory, not a place to live in. It may re-export and it
 * may compose already-imported functions into a namespace object; anything else belongs in a file
 * next to it, so a reader can tell what a directory offers without reading an implementation.
 * @param {import('estree').Declaration | null | undefined} declaration
 */
const isNamespaceObject = (declaration) => {
  if (declaration?.type !== 'VariableDeclaration') return false;
  return declaration.declarations.every((declarator) => isObjectLiteral(declarator.init));
};

/**
 * @param {import('estree').Directive
 *   | import('estree').Statement
 *   | import('estree').ModuleDeclaration} node
 */
const isAllowed = (node) => {
  if (node.type === 'ImportDeclaration' || node.type === 'ExportAllDeclaration') return true;
  if (node.type !== 'ExportNamedDeclaration') return false;
  return node.source !== null || node.declaration === null || isNamespaceObject(node.declaration);
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'index.ts only re-exports (AGENTS.md §4)' },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        for (const statement of node.body) {
          if (isAllowed(statement)) continue;
          context.report({
            node: statement,
            message: 'index.ts only re-exports. Move this into a file next to it and re-export it here.',
          });
        }
      },
    };
  },
};
